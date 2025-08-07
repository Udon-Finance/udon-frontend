'use client';

import React, { useState } from 'react';
import { ExternalLinkIcon, ArrowRight, ArrowLeftRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { Typography } from '@/components/common/typography';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/avatar';
import { cn } from '@/utils/tailwind';
import { Token, TOKENS_MAINNET, getWithdrawOptions } from '@/utils/bridge-constants';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WithdrawDialog: React.FC<WithdrawDialogProps> = ({ open, onOpenChange }) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
  };

  const handleBack = () => {
    setSelectedToken(null);
  };

  const handleWithdrawOption = (url: string) => {
    window.open(url, '_blank');
    onOpenChange(false);
  };

  const renderTokenList = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Typography variant="h4" weight="semibold" className="text-xl tracking-tight">
          Choose Asset
        </Typography>
        <Typography variant="small" color="submerged" className="text-sm leading-relaxed">
          Select which asset you&apos;d like to withdraw from Udon Protocol
        </Typography>
      </div>

      <div className="space-y-2">
        {TOKENS_MAINNET.map(token => (
          <div
            key={token.symbol}
            className={cn(
              'group relative flex items-center justify-between p-4 rounded-lg',
              'border border-border/50 bg-card/20 backdrop-blur-sm',
              'hover:border-border hover:bg-card/40 cursor-pointer',
              'transition-all duration-300 ease-out',
              'hover:shadow-sm'
            )}
            onClick={() => handleTokenSelect(token)}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                  <AvatarImage src={token.icon} alt={token.symbol} />
                  <AvatarFallback className="bg-card text-foreground font-medium">
                    {token.symbol.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-1">
                <Typography weight="semibold" className="text-base">
                  {token.symbol}
                </Typography>
                <Typography variant="small" color="submerged" className="text-xs">
                  {token.name}
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs px-2 py-1 rounded-md font-medium bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF] text-black">
                Cross-chain
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWithdrawOptions = () => {
    if (!selectedToken) return null;

    const options = getWithdrawOptions(selectedToken.symbol);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 hover:bg-muted/50 rounded-lg"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
              <AvatarImage src={selectedToken.icon} alt={selectedToken.symbol} />
              <AvatarFallback className="bg-card text-foreground font-medium">
                {selectedToken.symbol.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Typography weight="semibold" className="text-lg">
                Withdraw {selectedToken.symbol}
              </Typography>
              <Typography variant="small" color="submerged">
                Choose your preferred withdrawal method
              </Typography>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className={cn(
                'group relative p-4 rounded-lg border border-border/50',
                'bg-gradient-to-r from-card/20 to-card/10 backdrop-blur-sm',
                'hover:border-primary/30 hover:from-primary/5 hover:to-primary/10',
                'cursor-pointer transition-all duration-300 ease-out',
                'hover:shadow-sm'
              )}
              onClick={() => handleWithdrawOption(option.url)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <Typography weight="semibold" className="text-base">
                      {option.name}
                    </Typography>
                    <Typography variant="small" color="submerged" className="text-xs">
                      Cross-chain transfer via {option.name}
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs px-2 py-1 rounded-md font-medium bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF] text-black">
                    Cross-chain
                  </div>
                  <ExternalLinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
          <div className="flex items-start gap-3">
            <div>
              <Typography variant="small" weight="medium" className="text-foreground">
                Cross-Chain Transfer Process:{' '}
              </Typography>
              <Typography variant="small" color="submerged" className="mt-1">
                You will be redirected to Chromia Vault to complete the withdrawal securely. Your
                assets will be transferred cross-chain from Udon Protocol.
              </Typography>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-semibold text-center tracking-tight">
            Withdraw from Udon
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Select an asset and withdrawal method to transfer funds from Udon Protocol
          </DialogDescription>
        </DialogHeader>

        <div className="pb-2">{selectedToken ? renderWithdrawOptions() : renderTokenList()}</div>
      </DialogContent>
    </Dialog>
  );
};
