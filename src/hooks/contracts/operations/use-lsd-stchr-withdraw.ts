import { useCallback } from 'react';
import { createAmount, op } from '@chromia/ft4';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { publicClientConfig } from '@/configs/client';
import { useFtSession } from '@chromia/react';

interface StchrWithdrawParams {
  assetId: string | Buffer;
  amount: number | string;
  decimals: number;
  isUserWithdrawMax?: boolean;
}

interface StchrWithdrawResult {
  success: boolean;
  error?: Error;
}

/**
 * Hook for stCHR withdraw operation (Option 2: Immediate withdraw from lending pool)
 * @param callbacks Optional callbacks for success and error scenarios
 * @returns A function to execute stCHR withdraw operations
 */
export function useStchrWithdraw({
  onSuccess,
  onError,
}: {
  onSuccess?: (result: StchrWithdrawResult, params: StchrWithdrawParams) => void;
  onError?: (error: Error, params: StchrWithdrawParams) => void;
} = {}) {
  const { account, client } = useChromiaAccount();
  const { data: session } = useFtSession(
    account ? { clientConfig: publicClientConfig, account } : null
  );

  const withdrawStchr = useCallback(
    async (params: StchrWithdrawParams): Promise<StchrWithdrawResult> => {
      if (!session || !account) {
        const error = new Error('Session or account not available');
        onError?.(error, params);
        return { success: false, error };
      }

      try {
        console.log('Starting stCHR withdraw operation:', params);

        let amountValue;
        // Signal for rell to recognize we want to withdraw with max amount
        if (params.isUserWithdrawMax) {
          if (!client) {
            throw new Error('Client not available');
          }
          amountValue = await client.query('get_u256_max_query', {});
        } else {
          amountValue = createAmount(params.amount, params.decimals).value;
        }

        // Execute stCHR withdraw operation
        const result = await session
          .transactionBuilder()
          .add(op('withdraw_stchr', params.assetId, amountValue))
          .buildAndSend();

        console.log('stCHR withdraw transaction result:', result);

        if (result) {
          const successResult = { success: true };
          onSuccess?.(successResult, params);
          return successResult;
        } else {
          throw new Error('stCHR withdraw transaction failed');
        }
      } catch (error) {
        console.error('Error in stCHR withdraw operation:', error);
        const errorResult = {
          success: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
        onError?.(errorResult.error, params);
        return errorResult;
      }
    },
    [session, account, client, onSuccess, onError]
  );

  return withdrawStchr;
}
