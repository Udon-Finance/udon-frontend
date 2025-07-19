import { useCallback } from 'react';
import { createAmount, op } from '@chromia/ft4';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { publicClientConfig } from '@/configs/client';
import { useFtSession } from '@chromia/react';

interface HybridWithdrawParams {
  assetId: string | Buffer;
  chrAmount: number | string;
  stchrAmount: number | string;
  decimals: number;
}

interface HybridWithdrawResult {
  success: boolean;
  error?: Error;
}

/**
 * Hook for hybrid withdraw operation (Option 3: Withdraw both CHR and stCHR)
 * @param callbacks Optional callbacks for success and error scenarios
 * @returns A function to execute hybrid withdraw operations
 */
export function useHybridWithdraw({
  onSuccess,
  onError,
}: {
  onSuccess?: (result: HybridWithdrawResult, params: HybridWithdrawParams) => void;
  onError?: (error: Error, params: HybridWithdrawParams) => void;
} = {}) {
  const { account } = useChromiaAccount();
  const { data: session } = useFtSession(
    account ? { clientConfig: publicClientConfig, account } : null
  );

  const withdrawBoth = useCallback(
    async (params: HybridWithdrawParams): Promise<HybridWithdrawResult> => {
      if (!session || !account) {
        const error = new Error('Session or account not available');
        onError?.(error, params);
        return { success: false, error };
      }

      try {
        console.log('Starting hybrid withdraw operation:', params);

        // Execute hybrid withdraw operation
        const result = await session
          .transactionBuilder()
          .add(
            op(
              'withdraw_both',
              params.assetId,
              createAmount(params.chrAmount, params.decimals).value,
              createAmount(params.stchrAmount, params.decimals).value
            )
          )
          .buildAndSend();

        console.log('Hybrid withdraw transaction result:', result);

        if (result) {
          const successResult = { success: true };
          onSuccess?.(successResult, params);
          return successResult;
        } else {
          throw new Error('Hybrid withdraw transaction failed');
        }
      } catch (error) {
        console.error('Error in hybrid withdraw operation:', error);
        const errorResult = {
          success: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
        onError?.(errorResult.error, params);
        return errorResult;
      }
    },
    [session, account, onSuccess, onError]
  );

  return withdrawBoth;
}
