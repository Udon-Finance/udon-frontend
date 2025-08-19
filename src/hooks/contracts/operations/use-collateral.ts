import { useCallback } from 'react';
import { op } from '@chromia/ft4';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { publicClientConfig } from '@/configs/client';
import { useFtSession } from '@chromia/react';

interface CollateralParams {
  assetId: Buffer<ArrayBufferLike>;
  useAsCollateral: boolean;
}

interface useAsCollateralResult {
  success: boolean;
  error?: Error;
}

/**
 * Hook to collateral assets from the protocol
 * @param callbacks Optional callbacks for success and error scenarios
 * @returns A function to execute collateral operations
 */
export function useCollateral({
  onSuccess,
  onError,
}: {
  onSuccess?: (result: useAsCollateralResult, params: CollateralParams) => void;
  onError?: (error: Error, params: CollateralParams) => void;
} = {}) {
  const { account } = useChromiaAccount();
  const { data: session } = useFtSession(
    account ? { clientConfig: publicClientConfig, account } : null
  );

  const collateral = useCallback(
    async (params: CollateralParams): Promise<useAsCollateralResult> => {
      if (!session || !account) {
        const error = new Error('Session or account not available');
        onError?.(error, params);
        return { success: false, error };
      }

      try {
        // Execute collateral operation
        const result = await session
          .transactionBuilder()
          .add(
            op(
              'set_user_use_reserve_as_collateral_op',
              account.id, // from account (asset owner)
              params.assetId, // asset ID to collateral
              params.useAsCollateral, // useAsCollateral
              Date.now()
            )
          )
          .buildAndSend();

        console.log('Set useAsCollateral operation result:', result);

        const useAsCollateralResult = {
          success: true,
        };

        onSuccess?.(useAsCollateralResult, params);
        return useAsCollateralResult;
      } catch (error) {
        console.error('Collateral operation failed:', error);
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

  return collateral;
}
