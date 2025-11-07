import { useQuery, useMutation, type QueryKey, type UseQueryOptions, type UseQueryResult, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';

// Factory to create a typed useQuery hook with a fixed key/queryFn/options
export function createQueryHook<TQueryFnData, TError = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>,
) {
  return function useCreatedQuery(): UseQueryResult<TData, TError> {
    return useQuery<TQueryFnData, TError, TData, TQueryKey>({
      queryKey,
      queryFn,
      ...(options as any),
    });
  };
}

// Factory to create a typed useMutation hook with a fixed mutationFn/options
export function createMutationHook<TData, TError = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
) {
  return function useCreatedMutation(): UseMutationResult<TData, TError, TVariables, TContext> {
    return useMutation<TData, TError, TVariables, TContext>({
      mutationFn,
      ...(options as any),
    });
  };
}
