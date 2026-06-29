import type { RouterContext } from '../../../../../index';
import type {
  RouteResource,
  ResourceDependencies,
  ResourceType,
} from '../../../../common/types';
import {
  ExecutionTuple,
  ExecutionMaybeTuple,
  ResourceAction,
  GetResourceOptions,
} from '../../types';
import { getDefaultStateSlice } from '../get-default-state-slice';
import { getPrefetchSlice, getResourceState } from '../manage-resource-state';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
const fromEntries =
  Object.fromEntries ??
  (<T>(entries: [string, T][]) =>
    Object.assign({}, ...entries.map(([k, v]) => ({ [k]: v }))));

type MatchableType =
  | { type: ResourceType }
  | RouteResource
  | ExecutionTuple
  | ExecutionMaybeTuple;
const matchType = (a: MatchableType) => (b: MatchableType) => {
  const [{ type: typeA }] = Array.isArray(a) ? a : [a];
  const [{ type: typeB }] = Array.isArray(b) ? b : [b];

  return typeA === typeB;
};

export class ResourceDependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceDependencyError';
  }
}

// per-execution-cycle isolation: each executeTuples call gets a unique ID
let nextExecutionId = 0;
// tracks the ID of the execution currently iterating its tuples synchronously
let activeExecutionId: string | null = null;

/** Reset internal counters (for testing only). */
export const __resetExecutionCounter = (): void => {
  nextExecutionId = 0;
  activeExecutionId = null;
};

/**
 * Detect circular dependencies in the route resource graph.
 * Throws ResourceDependencyError on the first cycle found.
 */
function detectCycles(routeResources: RouteResource[]): void {
  const typeSet = new Set(routeResources.map(r => r.type));
  const graph = new Map<ResourceType, ResourceType[]>();

  for (const { type, depends } of routeResources) {
    if (depends?.length) {
      const validDeps = depends.filter(d => d !== type && typeSet.has(d));
      if (validDeps.length) {
        graph.set(type, validDeps);
      }
    }
  }

  const visited = new Set<ResourceType>();
  const visiting = new Set<ResourceType>();

  function dfs(node: ResourceType, path: ResourceType[]): void {
    if (visiting.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = [...path.slice(cycleStart), node];
      throw new ResourceDependencyError(
        `Circular dependency detected: ${cycle.join(' \u2192 ')}`
      );
    }
    if (visited.has(node)) return;

    visiting.add(node);
    path.push(node);

    for (const dep of graph.get(node) || []) {
      dfs(dep, path);
    }

    path.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }
}

/**
 * Find the execution context that contains the given resource.
 * Prefers the context identified by `preferredId` (the currently iterating
 * execution), falling back to a full search across all active contexts.
 */
function findExecutionContext(
  contexts: Record<string, ExecutionMaybeTuple[]>,
  resource: MatchableType,
  preferredId: string | null
): [string, ExecutionMaybeTuple[]] | undefined {
  if (preferredId && contexts[preferredId]) {
    const tuples = contexts[preferredId];
    if (tuples.some(matchType(resource))) {
      return [preferredId, tuples];
    }
  }

  for (const [id, tuples] of Object.entries(contexts)) {
    if (tuples.some(matchType(resource))) {
      return [id, tuples];
    }
  }

  return undefined;
}

/**
 * Remove an execution context by ID and return the cleaned state.
 * Returns null when no contexts remain.
 */
function removeExecutionContext(
  contexts: Record<string, ExecutionMaybeTuple[]>,
  executionId: string
): Record<string, ExecutionMaybeTuple[]> | null {
  const { [executionId]: _, ...remaining } = contexts;

  return Object.keys(remaining).length > 0 ? remaining : null;
}

export const executeTuples =
  <R>(
    routeResources: RouteResource[] | null | undefined,
    tuples: ExecutionTuple[]
  ): ResourceAction<R[]> =>
  ({ getState, setState, dispatch }) => {
    // check if there are resources and if so if there are any resources with dependencies
    const hasDependentResources =
      routeResources?.some(({ depends }) => depends?.length) ?? false;

    if (!hasDependentResources) {
      return tuples.map(([, action]) => dispatch(action));
    }

    // some resources might not be listed on the route resources so must be dispatched separate from executing state
    const listedTuples = tuples.filter(([resource]) =>
      routeResources?.some(matchType(resource))
    );
    if (listedTuples.length === 0) {
      return tuples.map(([, action]) => dispatch(action));
    }

    // validate the dependency graph for cycles
    detectCycles(routeResources!);

    // accumulate the dependency types for all executing resources
    // find downstream resources that may also execute and include their dependencies too
    // include the resource type as well in the list
    const [dependentTypes] = routeResources!
      .reduce<[ResourceType[], string[]]>(
        (acc, { type, depends }) => {
          const [dependencies, executableTypes] = acc;
          const isExecutable =
            executableTypes.includes(type) ||
            !!depends?.some(dependency => executableTypes.includes(dependency));

          return isExecutable
            ? [
                depends ? [...dependencies, ...depends, type] : dependencies,
                [...executableTypes, type],
              ]
            : acc;
        },
        [[], listedTuples.map(([{ type }]) => type)]
      )
      .filter((v, i, a) => a.indexOf(v) === i);

    // resources that are completely independent are preferable to be dispatched separate from executing state
    const dependentTuples = listedTuples.filter(([{ type }]) =>
      dependentTypes.includes(type)
    );
    if (dependentTuples.length === 0) {
      return tuples.map(([, action]) => dispatch(action));
    }

    // additionally find all direct dependencies of these executing or possibly executing resources
    const dependentAndDependencyTypes = routeResources!
      .filter(({ type }) => dependentTypes.includes(type))
      .reduce(
        (acc, { type, depends }) =>
          depends ? [...acc, ...depends, type] : [...acc, type],
        [] as ResourceType[]
      )
      .filter((v, i, a) => a.indexOf(v) === i);

    // setup executing tuples in route resource order
    // this state allows actions to call executeForDependents() to influence actions that follow
    // the list includes dependency resources so that getDependencies() may validate without needing route resources
    // we use the resource definition of the given tuple where present or otherwise the definition from route resources
    const executingTuples = routeResources!
      .filter(({ type }) => dependentAndDependencyTypes.includes(type))
      .map(
        resource =>
          tuples.find(matchType(resource)) ??
          ([resource, null] as ExecutionMaybeTuple)
      );

    // allocate a unique execution context so overlapping calls do not collide
    const executionId = String(++nextExecutionId);
    const prevContexts = getState().executing || {};
    setState({
      executing: { ...prevContexts, [executionId]: executingTuples },
    });

    const prevActiveId = activeExecutionId;
    activeExecutionId = executionId;

    try {
      // dispatch sequentially during which executeForDependents() can cause tuples to change
      const executedResults = executingTuples.map(
        ([{ type: expectedType }], i) => {
          const latestTuple = getState().executing?.[executionId]?.[i];
          const [{ type: latestType }, maybeAction] = latestTuple ?? [{}];

          if (latestType !== expectedType) {
            setState({
              executing: removeExecutionContext(
                getState().executing || {},
                executionId
              ),
            });
            throw new Error('execution reached an inconsistent state');
          }

          return maybeAction ? dispatch(maybeAction) : undefined;
        }
      );

      setState({
        executing: removeExecutionContext(
          getState().executing || {},
          executionId
        ),
      });

      // pick existing execution result or dispatch any remaining independent actions
      return tuples.map(([resource, action]) => {
        const index = executingTuples.findIndex(matchType(resource));

        return index < 0 ? dispatch(action) : executedResults[index];
      });
    } finally {
      activeExecutionId = prevActiveId;
    }
  };

export const actionWithDependencies =
  <R extends unknown>(
    routeResources: RouteResource[] | undefined,
    resource: RouteResource,
    action: ResourceAction<R>
  ): ResourceAction<R> =>
  ({ dispatch }) =>
    dispatch(executeTuples<R>(routeResources, [[resource, action]]))[0];

export const mapActionWithDependencies = <R extends unknown>(
  routeResources: RouteResource[] | undefined,
  resources: RouteResource[],
  actionCreator: (resource: RouteResource) => ResourceAction<R>
): ResourceAction<R[]> =>
  executeTuples<R>(
    routeResources,
    resources.map(resource => [resource, actionCreator(resource)])
  );

export const executeForDependents =
  <R extends unknown>(
    resource: RouteResource,
    actionCreator: (r: RouteResource) => ResourceAction<R>
  ): ResourceAction<void> =>
  ({ getState, setState }) => {
    const { executing: contexts } = getState();
    if (!contexts) {
      return;
    }

    // find the execution context that owns this resource
    const found = findExecutionContext(contexts, resource, activeExecutionId);
    if (!found) {
      return;
    }

    const [contextId, tuples] = found;
    const indexForResource = tuples.findIndex(matchType(resource));
    if (indexForResource < 0) {
      return;
    }

    // find dependent resources following given resource and revise their action
    const updatedTuples = tuples.map((tuple, i): ExecutionMaybeTuple => {
      const [tupleResource] = tuple;

      return i > indexForResource &&
        tupleResource.depends?.includes(resource.type)
        ? [tupleResource, actionCreator(tupleResource)]
        : tuple;
    });

    setState({ executing: { ...contexts, [contextId]: updatedTuples } });
  };

export const getDependencies =
  (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ): ResourceAction<ResourceDependencies> =>
  ({ getState, dispatch }) => {
    const { type, depends } = resource;

    // optimise the case of no dependencies
    if (!depends?.length) {
      return {};
    }

    const { executing: contexts, context: resourceStoreContext } = getState();

    // find the execution context that contains this resource
    let tuples: ExecutionMaybeTuple[] | undefined;
    if (contexts) {
      const found = findExecutionContext(contexts, resource, activeExecutionId);
      if (found) {
        tuples = found[1];
      }
    }

    // dependent resource cannot be called outside execution state
    // find the given resource type in the currently executing tuples
    const indexForResource = tuples?.findIndex(matchType(resource)) ?? -1;
    if (indexForResource < 0) {
      throw new ResourceDependencyError(
        `Missing resource: "${type}" has dependencies so must not be missing`
      );
    }

    // find tuples index for all the dependency elements
    const dependencyIndexTuples = depends.map(
      dependency =>
        [
          dependency,
          tuples!.findIndex(matchType({ type: dependency })),
        ] as const
    );

    // we rely on executing tuples including all dependencies of the caller resource
    dependencyIndexTuples.forEach(([dependency, index]) => {
      if (index < 0) {
        throw new ResourceDependencyError(
          `Missing resource: "${type}" depends "${dependency}" which is missing`
        );
      }
      if (index > indexForResource) {
        throw new ResourceDependencyError(
          `Illegal dependency: "${type}" depends "${dependency}" so "${dependency}" must precede "${type}"`
        );
      }
    });

    return fromEntries(
      dependencyIndexTuples.map(([dependencyType, index]) => {
        const { getKey } = tuples![index]![0];
        const key = getKey(routerStoreContext, resourceStoreContext);
        let slice =
          dispatch(getResourceState(dependencyType, key)) ||
          getDefaultStateSlice();

        // when prefetching we provide only the promise to dependands
        const prefetchSlice = options.prefetch
          ? dispatch(getPrefetchSlice(dependencyType, key))
          : undefined;
        if (prefetchSlice) {
          slice = {
            ...slice,
            // not spreading prefetchSlice to persist previous slice data
            promise: prefetchSlice.promise,
            expiresAt: prefetchSlice.expiresAt,
            loading: true,
          };
        }

        return [dependencyType, slice];
      })
    );
  };
