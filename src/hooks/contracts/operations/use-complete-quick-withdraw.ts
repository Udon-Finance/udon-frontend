import { useCallback } from 'react';
import { createAmount, op } from '@chromia/ft4';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { publicClientConfig } from '@/configs/client';
import { useFtSession } from '@chromia/react';

interface CompleteQuickWithdrawParams {
  positionId: Buffer<ArrayBufferLike>;
  underlyingAssetId: Buffer<ArrayBufferLike>;
  stAssetAmount: number;
}

interface CompleteQuickWithdrawResult {
  success: boolean;
  error?: Error;
}

/**
 * Hook to complete quick withdraw operations when they are ready for final claim
 * @param callbacks Optional callbacks for success and error scenarios
 * @returns A function to execute complete quick withdraw operations
 */
export function useCompleteQuickWithdraw({
  onSuccess,
  onError,
}: {
  onSuccess?: (result: CompleteQuickWithdrawResult, params: CompleteQuickWithdrawParams) => void;
  onError?: (error: Error, params: CompleteQuickWithdrawParams) => void;
} = {}) {
  const { account } = useChromiaAccount();
  const { data: session } = useFtSession(
    account ? { clientConfig: publicClientConfig, account } : null
  );

  const completeQuickWithdraw = useCallback(
    async (params: CompleteQuickWithdrawParams): Promise<CompleteQuickWithdrawResult> => {
      if (!session || !account) {
        const error = new Error('Session or account not available');
        onError?.(error, params);
        return { success: false, error };
      }

      try {
        console.log('Starting complete quick withdraw operation:', params);

        // Execute complete quick withdraw operation
        const result = await session
          .transactionBuilder()
          .add(
            op(
              'complete_quick_withdraw_operation',
              params.positionId,
              params.underlyingAssetId,
              createAmount(params.stAssetAmount, 6).value,
              0n, // Additional amount (not used in basic implementation)
              Date.now()
            )
          )
          .buildAndSend();

        console.log('Complete quick withdraw operation result:', result);

        const completeQuickWithdrawResult = {
          success: true,
        };

        onSuccess?.(completeQuickWithdrawResult, params);
        return completeQuickWithdrawResult;
      } catch (error) {
        console.error('Complete quick withdraw operation failed:', error);
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

  return completeQuickWithdraw;
}
