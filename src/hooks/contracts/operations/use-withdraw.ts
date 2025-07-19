import { useCallback } from 'react';
import { createAmount, op } from '@chromia/ft4';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { publicClientConfig } from '@/configs/client';
import { useFtSession } from '@chromia/react';

interface WithdrawParams {
  assetId: Buffer<ArrayBufferLike>;
  amount: number | string;
  decimals: number;
  isUserWithdrawMax?: boolean;
  withdrawType: WithdrawType;
}

interface WithdrawResult {
  success: boolean;
  error?: Error;
}

type WithdrawType = 'slow' | 'quick' | 'none';

/**
 * Hook to withdraw assets from the protocol
 * @param callbacks Optional callbacks for success and error scenarios
 * @returns A function to execute withdraw operations
 */
export function useWithdraw({
  onSuccess,
  onError,
}: {
  onSuccess?: (result: WithdrawResult, params: WithdrawParams) => void;
  onError?: (error: Error, params: WithdrawParams) => void;
} = {}) {
  const { account, client } = useChromiaAccount();
  const { data: session } = useFtSession(
    account ? { clientConfig: publicClientConfig, account } : null
  );

  const withdraw = useCallback(
    async (params: WithdrawParams): Promise<WithdrawResult> => {
      if (!session || !account) {
        const error = new Error('Session or account not available');
        onError?.(error, params);
        return { success: false, error };
      }

      try {
        console.log('Starting withdraw operation:', params);

        let amountValue;
        // signal for rell recognize we want to withdraw with max amount
        if (params.isUserWithdrawMax) {
          if (!client) {
            throw new Error('Client not available');
          }
          amountValue = await client.query('get_u256_max_query', {});
        } else amountValue = createAmount(params.amount, params.decimals).value;

        console.log('Amount in decimals format:', amountValue);
        console.log('Actual BigInt(amountValue.toString())', BigInt(amountValue.toString()));

        // Execute withdraw operation
        const result = await session
          .transactionBuilder()
          .add(
            op(
              'withdraw',
              account.id, // from account (asset owner)
              params.assetId, // asset ID to withdraw
              amountValue, // amount
              account.id, // to_id,
              params.withdrawType,
              Date.now()
            )
          )
          .buildAndSend();

        console.log('Withdraw operation result:', result);

        const withdrawResult = {
          success: true,
        };

        onSuccess?.(withdrawResult, params);
        return withdrawResult;
      } catch (error) {
        console.error('Withdraw operation failed:', error);
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

  return withdraw;
}
