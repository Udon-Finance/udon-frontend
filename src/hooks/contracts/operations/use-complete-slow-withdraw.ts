import { useCallback } from 'react';
import { op } from '@chromia/ft4';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { publicClientConfig } from '@/configs/client';
import { useFtSession } from '@chromia/react';

interface CompleteSlowWithdrawParams {
  positionId: Buffer<ArrayBufferLike>;
  underlyingAssetId: Buffer<ArrayBufferLike>;
  stAssetAmount: number;
}

interface CompleteSlowWithdrawResult {
  success: boolean;
  error?: Error;
}

/**
 * Hook to complete slow withdraw operations when they are ready (after 14 days)
 * @param callbacks Optional callbacks for success and error scenarios
 * @returns A function to execute complete slow withdraw operations
 */
export function useCompleteSlowWithdraw({
  onSuccess,
  onError,
}: {
  onSuccess?: (result: CompleteSlowWithdrawResult, params: CompleteSlowWithdrawParams) => void;
  onError?: (error: Error, params: CompleteSlowWithdrawParams) => void;
} = {}) {
  const { account } = useChromiaAccount();
  const { data: session } = useFtSession(
    account ? { clientConfig: publicClientConfig, account } : null
  );

  const completeSlowWithdraw = useCallback(
    async (params: CompleteSlowWithdrawParams): Promise<CompleteSlowWithdrawResult> => {
      if (!session || !account) {
        const error = new Error('Session or account not available');
        onError?.(error, params);
        return { success: false, error };
      }

      try {
        console.log('Starting complete slow withdraw operation:', params);

        // Execute complete slow withdraw operation
        const result = await session
          .transactionBuilder()
          .add(
            op(
              'complete_slow_withdraw_operation',
              params.positionId,
              params.underlyingAssetId,
              params.stAssetAmount,
              0n, // Additional amount (not used in basic implementation)
              Date.now()
            )
          )
          .buildAndSend();

        console.log('Complete slow withdraw operation result:', result);

        const completeSlowWithdrawResult = {
          success: true,
        };

        onSuccess?.(completeSlowWithdrawResult, params);
        return completeSlowWithdrawResult;
      } catch (error) {
        console.error('Complete slow withdraw operation failed:', error);
        const errorObj = error instanceof Error ? error : new Error(String(error));
        onError?.(errorObj, params);
        return {
          success: false,
          error: errorObj,
        };
      }
    },
    [session, account, onSuccess, onError]
  );

  return completeSlowWithdraw;
}
