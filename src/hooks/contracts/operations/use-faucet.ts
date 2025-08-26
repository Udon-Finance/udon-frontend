import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createAmount, op } from '@chromia/ft4';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { publicClientConfig } from '@/configs/client';
import { useFtSession } from '@chromia/react';
// import { normalize } from '@/utils/bignumber';

interface UseFaucetReturn {
  requestTokens: (symbol: string, decimals: number, mintAmount: number) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}

export function useFaucet(): UseFaucetReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useChromiaAccount();
  const { data: session } = useFtSession(
    account ? { clientConfig: publicClientConfig, account } : null
  );

  const requestTokens = useCallback(
    async (symbol: string, decimals: number, mintAmount: number): Promise<void> => {
      if (!session || !account?.id) {
        toast.error('Wallet not connected');
        throw new Error('Wallet not connected');
      }

      try {
        setIsPending(true);
        setError(null);

        const userAccountId = account.id;

        // Get asset ID for the requested token symbol
        const underlyingAssetResult = await session.getAssetsBySymbol(symbol);
        const underlyingAssetId = underlyingAssetResult.data[0]?.id;

        if (!underlyingAssetId) {
          throw new Error(`Asset ${symbol} not found`);
        }

        // Execute the mint operation
        const result = await session
          .transactionBuilder()
          .add(
            op(
              'mint_underlying_asset',
              userAccountId,
              createAmount(mintAmount, decimals).value,
              underlyingAssetId
            )
          )
          // .add(
          //   op(
          //     'set_using_as_collateral_op',
          //     userAccountId,
          //     underlyingAssetId,
          //     true // enable collateral
          //   )
          // )
          .buildAndSend();

        console.log('Mint operation result:', result);

        toast.success(
          `Successfully minted ${mintAmount} ${symbol.replace(/USD$/, '')} tokens to your wallet`
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to request tokens');
        setError(error);
        toast.error(`Failed to mint ${symbol.replace(/USD$/, '')} tokens: ${error.message}`);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [account, session]
  );

  return {
    requestTokens,
    isPending,
    error,
  };
}
