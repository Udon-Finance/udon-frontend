'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/tab/anim-underline';
import { Typography } from '@/components/common/typography';
import { UserAccountData, UserReserveData } from '../../types';
import { Badge } from '@/components/common/badge';
import { Skeleton } from '@/components/common/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/avatar';
import { Button } from '@/components/common/button';
import { Switch } from '@/components/common/switch';
import { useRouter } from 'next/navigation';
import CountUp from '@/components/common/count-up';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/tooltip';
import { useState } from 'react';
import { SupplyDialog } from '../supply/supply-dialog';
import { WithdrawDialog } from '../supply/withdraw-dialog';
import { CollateralDialog } from '../supply/collateral-dialog';
import { BorrowDialog } from '../borrow/borrow-dialog';
import { RepayDialog } from '../borrow/repay-dialog';

interface MobilePositionTabsProps {
  supplyPositions: UserReserveData[];
  borrowPositions: UserReserveData[];
  isLoading: boolean;
  mutateAssets: () => void;
  yourSupplyBalancePosition: number;
  yourSupplyCollateralPosition: number;
  yourSupplyAPYPosition: number;
  yourBorrowBalancePosition: number;
  yourBorrowPowerUsagePosition: number;
  yourBorrowAPYPosition: number;
  enableBorrow: boolean;
  accountData: UserAccountData;
}

export const MobilePositionTabs: React.FC<MobilePositionTabsProps> = ({
  supplyPositions,
  borrowPositions,
  isLoading,
  mutateAssets,
  yourSupplyBalancePosition,
  yourSupplyCollateralPosition,
  yourSupplyAPYPosition,
  yourBorrowBalancePosition,
  yourBorrowPowerUsagePosition,
  yourBorrowAPYPosition,
  enableBorrow,
  accountData,
}) => {
  const router = useRouter();

  // Dialog state management for Supply
  const [selectedSupplyPosition, setSelectedSupplyPosition] = useState<UserReserveData | null>(
    null
  );
  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [collateralDialogOpen, setCollateralDialogOpen] = useState(false);

  // Dialog state management for Borrow
  const [selectedBorrowPosition, setSelectedBorrowPosition] = useState<UserReserveData | null>(
    null
  );
  const [repayDialogOpen, setRepayDialogOpen] = useState(false);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);

  // Handle supply actions
  const handleSupplyClick = (position: UserReserveData) => {
    setSelectedSupplyPosition(position);
    setSupplyDialogOpen(true);
  };

  const handleWithdrawClick = (position: UserReserveData) => {
    setSelectedSupplyPosition(position);
    setWithdrawDialogOpen(true);
  };

  const handleCollateralSwitch = (position: UserReserveData) => {
    setSelectedSupplyPosition(position);
    setCollateralDialogOpen(true);
  };

  // Handle borrow actions
  const handleRepayClick = (position: UserReserveData) => {
    setSelectedBorrowPosition(position);
    setRepayDialogOpen(true);
  };

  const handleBorrowClick = (position: UserReserveData) => {
    setSelectedBorrowPosition(position);
    setBorrowDialogOpen(true);
  };

  // Handle asset click (navigation)
  const handleAssetClick = (assetId: string) => {
    router.push(`/reserve/${assetId}`);
  };

  const renderAssetCell = (asset: UserReserveData) => {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleAssetClick(asset.assetId.toString('hex'))}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={asset.iconUrl} alt={asset.symbol} />
                <AvatarFallback>{asset.symbol.charAt(0)}</AvatarFallback>
              </Avatar>
              <Typography weight="medium" className="text-2xl">
                {asset.symbol}
              </Typography>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{asset.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Supply position skeleton
  const SupplyPositionSkeleton = () => (
    <div className="border border-border rounded-lg py-3 px-4 bg-black/20">
      <div className="flex justify-between mb-1">
        {/* Top row: Asset name and Collateral switch */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-16 h-8" />
        </div>
        <Skeleton className="w-10 h-5 rounded-full" />
      </div>

      <div className="flex">
        {/* Left section */}
        <div className="flex flex-1 flex-col">
          {/* Col layout for Price/APY and Supplied/Balance */}
          <div className="flex mt-2">
            {/* Col 1: Price and APY */}
            <div className="w-[40%]">
              <div className="mb-2">
                <Typography color="submerged" className="mb-[2px] text-[12px]">
                  Price
                </Typography>
                <Skeleton className="w-16 h-5" />
              </div>
              <div>
                <Typography color="submerged" className="mb-[2px] text-[12px]">
                  APY
                </Typography>
                <Skeleton className="w-16 h-5" />
              </div>
            </div>

            {/* Col 2: Supplied and Balance */}
            <div className="flex-1">
              <div className="mb-2">
                <Typography color="submerged" className="mb-[2px] text-[12px]">
                  Supplied
                </Typography>
                <Skeleton className="w-24 h-5" />
              </div>
              <div>
                <Typography color="submerged" className="mb-[2px] text-[12px]">
                  Balance
                </Typography>
                <Skeleton className="w-24 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex flex-col gap-2 justify-center">
          <Skeleton className="w-[80px] h-6 rounded-md" />
          <Skeleton className="w-[80px] h-6 rounded-md" />
        </div>
      </div>
    </div>
  );

  // Borrow position skeleton
  const BorrowPositionSkeleton = () => (
    <div className="border border-border rounded-lg py-3 px-4 bg-black/20">
      <div className="flex">
        {/* Left section */}
        <div className="flex flex-1 flex-col">
          {/* Row 1: Asset */}
          <div className="">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-16 h-8" />
            </div>
          </div>

          {/* Col layout for Price/APY and Debt/Balance */}
          <div className="flex mt-2">
            {/* Col 1: Price and APY */}
            <div className="w-[40%]">
              <div className="mb-2">
                <Typography color="submerged" className="mb-[2px] text-[12px]">
                  Price
                </Typography>
                <Skeleton className="w-16 h-5" />
              </div>
              <div>
                <Typography color="submerged" className="mb-[2px] text-[12px]">
                  APY
                </Typography>
                <Skeleton className="w-16 h-5" />
              </div>
            </div>

            {/* Col 2: Debt and Balance */}
            <div className="flex-1">
              <div className="mb-2">
                <Typography color="submerged" className="mb-[2px] text-[12px]">
                  Debt
                </Typography>
                <Skeleton className="w-24 h-5" />
              </div>
              <div>
                <Typography color="submerged" className="mb-[2px] text-[12px]">
                  Balance
                </Typography>
                <Skeleton className="w-24 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex flex-col gap-2 justify-center">
          <Skeleton className="w-[80px] h-6 rounded-md" />
          <Skeleton className="w-[80px] h-6 rounded-md" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Tabs defaultValue="supply" className="w-full">
        <TabsList className="w-full h-14 rounded-t-2xl rounded-b-none bg-card p-0 border border-b border-border">
          <TabsTrigger value="supply" className="flex-1 h-full py-4 text-base">
            Your Supply
          </TabsTrigger>
          <TabsTrigger value="borrow" className="flex-1 h-full py-4 text-base">
            Your Borrow
          </TabsTrigger>
        </TabsList>

        {/* Supply Positions Tab Content */}
        <TabsContent value="supply" className="px-4 py-5">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4 flex-wrap">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <SupplyPositionSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {supplyPositions.length > 0 ? (
                <>
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <Badge variant="outline" className="text-sm px-3 gap-1">
                      <Typography weight="medium">Balance:</Typography>
                      {yourSupplyBalancePosition ? (
                        <CountUp
                          value={yourSupplyBalancePosition}
                          prefix="$"
                          className="text-sm ml-1"
                        />
                      ) : (
                        <Typography>_</Typography>
                      )}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 gap-1">
                      <Typography weight="medium">APY:</Typography>
                      {yourSupplyAPYPosition ? (
                        <CountUp
                          value={yourSupplyAPYPosition}
                          suffix="%"
                          className="text-sm ml-1"
                          decimals={2}
                        />
                      ) : (
                        <Typography>_</Typography>
                      )}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 gap-1">
                      <Typography weight="medium">Collateral:</Typography>
                      {yourSupplyCollateralPosition ? (
                        <CountUp
                          value={yourSupplyCollateralPosition}
                          prefix="$"
                          className="text-sm ml-1"
                        />
                      ) : (
                        <Typography>_</Typography>
                      )}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {supplyPositions.map((position, index) => (
                      <div
                        key={position.symbol}
                        className={`border border-border rounded-lg py-3 px-4 ${
                          index % 2 === 0 ? 'bg-black/20' : 'bg-card'
                        }`}
                      >
                        {/* Top row: Asset name and Collateral switch */}
                        <div className="flex justify-between mb-1">
                          <div>{renderAssetCell(position)}</div>
                          <div className="flex items-center">
                            <Typography color="submerged" className="mr-2 text-[12px]">
                              Collateral
                            </Typography>
                            <Switch
                              checked={position.usageAsCollateralEnabled}
                              onCheckedChange={() => handleCollateralSwitch(position)}
                              className="scale-75 origin-left"
                            />
                          </div>
                        </div>

                        <div className="flex">
                          {/* Left section */}
                          <div className="flex flex-1 flex-col">
                            {/* Col layout for Price/APY and Supplied/Balance */}
                            <div className="flex mt-2">
                              {/* Col 1: Price and APY */}
                              <div className="w-[40%]">
                                <div className="mb-2">
                                  <Typography color="submerged" className="mb-[2px] text-[12px]">
                                    Price
                                  </Typography>
                                  <CountUp value={position.price} prefix="$" />
                                </div>
                                <div>
                                  <Typography color="submerged" className="mb-[2px] text-[12px]">
                                    APY
                                  </Typography>
                                  {position.supplyAPY === 0 ? (
                                    <Typography>-</Typography>
                                  ) : (
                                    <CountUp value={position.supplyAPY} suffix="%" decimals={2} />
                                  )}
                                </div>
                              </div>

                              {/* Col 2: Supplied and Balance */}
                              <div className="flex-1">
                                <div className="mb-2">
                                  <Typography color="submerged" className="mb-[2px] text-[12px]">
                                    Supplied
                                  </Typography>
                                  <div className="flex flex-row items-center gap-1">
                                    <CountUp
                                      value={Number(position.currentATokenBalance)}
                                      className="text-base"
                                    />
                                    <Typography color="submerged">~</Typography>
                                    <CountUp
                                      value={Number(position.currentATokenBalance) * position.price}
                                      className="text-base text-submerged"
                                      prefix="$"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Typography color="submerged" className="mb-[2px] text-[12px]">
                                    Balance
                                  </Typography>
                                  {position.balance === 0 ? (
                                    <Typography>-</Typography>
                                  ) : (
                                    <div className="flex flex-row items-center gap-1">
                                      <CountUp value={position.balance} className="text-base" />
                                      <Typography color="submerged">~</Typography>
                                      <CountUp
                                        value={position.price * position.balance}
                                        className="text-base text-submerged"
                                        prefix="$"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right section */}
                          <div className="flex flex-col gap-2 justify-center">
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => handleSupplyClick(position)}
                              className="w-[80px] !py-0 !px-2 text-base"
                            >
                              Supply
                            </Button>
                            <Button
                              variant="outlineGradient"
                              size="sm"
                              onClick={() => handleWithdrawClick(position)}
                              className="w-[80px] !py-0 !px-2 text-base"
                            >
                              Withdraw
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-grow items-center justify-center py-10">
                  <Typography className="text-submerged text-center text-lg">
                    No supply positions found. <br />
                    Start supplying assets to earn interest.
                  </Typography>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Borrow Positions Tab Content */}
        <TabsContent value="borrow" className="px-4 py-5">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4 flex-wrap">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <BorrowPositionSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {borrowPositions.length > 0 ? (
                <>
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <Badge variant="outline" className="text-sm px-3 gap-1">
                      <Typography weight="medium">Balance:</Typography>
                      {yourBorrowBalancePosition ? (
                        <CountUp
                          value={yourBorrowBalancePosition}
                          prefix="$"
                          className="text-sm ml-1"
                        />
                      ) : (
                        <Typography>_</Typography>
                      )}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 gap-1">
                      <Typography weight="medium">APY:</Typography>
                      {yourBorrowAPYPosition ? (
                        <CountUp
                          value={yourBorrowAPYPosition}
                          suffix="%"
                          className="text-sm ml-1"
                          decimals={2}
                        />
                      ) : (
                        <Typography>_</Typography>
                      )}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 gap-1">
                      <Typography weight="medium">Power Usage:</Typography>
                      {yourBorrowPowerUsagePosition ? (
                        <CountUp value={yourBorrowPowerUsagePosition} className="text-sm ml-1" />
                      ) : (
                        <Typography>_</Typography>
                      )}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {borrowPositions.map((position, index) => (
                      <div
                        key={position.symbol}
                        className={`border border-border rounded-lg py-3 px-4 ${
                          index % 2 === 0 ? 'bg-black/20' : 'bg-card'
                        }`}
                      >
                        <div className="flex">
                          {/* Left section */}
                          <div className="flex flex-1 flex-col">
                            {/* Row 1: Asset */}
                            <div className="">{renderAssetCell(position)}</div>

                            {/* Col layout for Price/APY and Debt/Balance */}
                            <div className="flex mt-2">
                              {/* Col 1: Price and APY */}
                              <div className="w-[40%]">
                                <div className="mb-2">
                                  <Typography color="submerged" className="mb-[2px] text-[12px]">
                                    Price
                                  </Typography>
                                  <CountUp value={position.price} prefix="$" />
                                </div>
                                <div>
                                  <Typography color="submerged" className="mb-[2px] text-[12px]">
                                    APY
                                  </Typography>
                                  {position.borrowAPY === 0 ? (
                                    <Typography>-</Typography>
                                  ) : (
                                    <CountUp value={position.borrowAPY} suffix="%" decimals={2} />
                                  )}
                                </div>
                              </div>

                              {/* Col 2: Debt and Balance */}
                              <div className="flex-1">
                                <div className="mb-2">
                                  <Typography color="submerged" className="mb-[2px] text-[12px]">
                                    Debt
                                  </Typography>
                                  {position.currentVariableDebt === 0 ? (
                                    <Typography>-</Typography>
                                  ) : (
                                    <div className="flex flex-row items-center gap-1">
                                      <CountUp
                                        value={position.currentVariableDebt}
                                        className="text-base"
                                      />
                                      <Typography color="submerged">~</Typography>
                                      <CountUp
                                        value={position.price * position.currentVariableDebt}
                                        className="text-base text-submerged"
                                        prefix="$"
                                      />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <Typography color="submerged" className="mb-[2px] text-[12px]">
                                    Balance
                                  </Typography>
                                  {position.balance === 0 ? (
                                    <Typography>-</Typography>
                                  ) : (
                                    <div className="flex flex-row items-center gap-1">
                                      <CountUp value={position.balance} className="text-base" />
                                      <Typography color="submerged">~</Typography>
                                      <CountUp
                                        value={position.price * position.balance}
                                        className="text-base text-submerged"
                                        prefix="$"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right section */}
                          <div className="flex flex-col gap-2 justify-center">
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => handleBorrowClick(position)}
                              disabled={!enableBorrow}
                              className="w-[80px] !py-0 !px-2 text-base"
                            >
                              Borrow
                            </Button>
                            <Button
                              variant="outlineGradient"
                              size="sm"
                              onClick={() => handleRepayClick(position)}
                              className="w-[80px] !py-0 !px-2 text-base"
                            >
                              Repay
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-grow items-center justify-center py-10">
                  <Typography className="text-submerged text-center text-lg">
                    No borrow positions found. <br />
                    Start borrowing assets to leverage your portfolio.
                  </Typography>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Supply Dialogs */}
      {selectedSupplyPosition && supplyDialogOpen && (
        <SupplyDialog
          open={supplyDialogOpen}
          onOpenChange={setSupplyDialogOpen}
          reserve={selectedSupplyPosition}
          mutateAssets={mutateAssets}
          accountData={accountData}
        />
      )}

      {selectedSupplyPosition && withdrawDialogOpen && (
        <WithdrawDialog
          open={withdrawDialogOpen}
          onOpenChange={setWithdrawDialogOpen}
          reserve={selectedSupplyPosition}
          accountData={accountData}
          mutateAssets={mutateAssets}
        />
      )}

      {selectedSupplyPosition && collateralDialogOpen && (
        <CollateralDialog
          open={collateralDialogOpen}
          onOpenChange={setCollateralDialogOpen}
          reserve={selectedSupplyPosition}
          accountData={accountData}
          mutateAssets={mutateAssets}
        />
      )}

      {/* Borrow Dialogs */}
      {selectedBorrowPosition && repayDialogOpen && (
        <RepayDialog
          open={repayDialogOpen}
          onOpenChange={setRepayDialogOpen}
          reserve={selectedBorrowPosition}
          accountData={accountData}
          mutateAssets={mutateAssets}
        />
      )}

      {selectedBorrowPosition && borrowDialogOpen && (
        <BorrowDialog
          open={borrowDialogOpen}
          onOpenChange={setBorrowDialogOpen}
          reserve={selectedBorrowPosition}
          accountData={accountData}
          mutateAssets={mutateAssets}
        />
      )}
    </div>
  );
};
