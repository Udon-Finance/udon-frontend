'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/common/table';
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from '@/components/ui/pagination';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { Typography } from '../typography';
import { Button } from '../button';
import { Skeleton } from '../skeleton';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (info: { row: T }) => React.ReactNode;
  enableSorting?: boolean;
  meta?: {
    skeleton?: React.ReactNode | (() => React.ReactNode);
  };
}

interface SortableTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  className?: string;
  isLoading?: boolean;
  skeletonRows?: number;
  expandedRows?: Set<string>;
  renderExpandableContent?: (symbol: string) => React.ReactNode | null;
}

export function SortableTable<T>({
  data,
  columns,
  pageSize = 10,
  className,
  isLoading = false,
  skeletonRows = 3,
  expandedRows,
  renderExpandableContent,
}: SortableTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleSort = (column: keyof T) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn || sortDirection === null) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    return sortDirection === 'asc'
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = isLoading
    ? Array(skeletonRows).fill({})
    : sortedData.slice(startIndex, startIndex + pageSize);

  const renderSkeletonOrCell = (column: ColumnDef<T>) => {
    if (isLoading) {
      // Render skeleton if provided, otherwise default skeleton
      if (column.meta?.skeleton) {
        return typeof column.meta.skeleton === 'function'
          ? column.meta.skeleton()
          : column.meta.skeleton;
      }
      // Default skeleton based on position
      if (column.accessorKey === 'symbol' || column.header === 'Assets') {
        return (
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        );
      }
      return <Skeleton className="h-5 w-20" />;
    }
    return null;
  };

  const renderHeaderSkeleton = (column: ColumnDef<T>, index: number) => {
    // Vary width based on column position or header text length
    let skeletonWidth = 'w-16';

    // First column (assets column) is usually wider
    if (index === 0 || column.header === 'Assets') {
      skeletonWidth = 'w-24';
    }
    // Last column (actions) is usually smaller
    else if (index === columns.length - 1) {
      skeletonWidth = 'w-12';
    }
    // Columns with longer headers
    else if (column.header.length > 8) {
      skeletonWidth = 'w-20';
    }

    return <Skeleton className={`h-5 ${skeletonWidth}`} />;
  };

  //   const renderPageNumbers = () => {
  //     const pages = [];
  //     const maxVisiblePages = 5;

  //     if (totalPages <= maxVisiblePages) {
  //       for (let i = 1; i <= totalPages; i++) {
  //         pages.push(i);
  //       }
  //     } else {
  //       // Always show first page
  //       pages.push(1);

  //       // Calculate range around current page
  //       let start = Math.max(2, currentPage - 1);
  //       let end = Math.min(totalPages - 1, currentPage + 1);

  //       // Adjust if we're near the start
  //       if (currentPage <= 3) {
  //         end = Math.min(totalPages - 1, 4);
  //       }

  //       // Adjust if we're near the end
  //       if (currentPage >= totalPages - 2) {
  //         start = Math.max(2, totalPages - 3);
  //       }

  //       // Add ellipsis before range if needed
  //       if (start > 2) {
  //         pages.push('...');
  //       }

  //       // Add range
  //       for (let i = start; i <= end; i++) {
  //         pages.push(i);
  //       }

  //       // Add ellipsis after range if needed
  //       if (end < totalPages - 1) {
  //         pages.push('...');
  //       }

  //       // Always show last page
  //       pages.push(totalPages);
  //     }

  //     return pages;
  //   };

  return (
    <div className={cn('w-full rounded-xl bg-card border', className)}>
      <div className="w-full rounded-lg">
        <Table className="w-full rounded-lg">
          <TableHeader>
            <TableRow className="border-none">
              {columns.map((column, i) => (
                <TableHead
                  key={i}
                  className={cn(
                    'text-embossed font-medium py-3',
                    !isLoading ? 'bg-background' : 'bg-primary/5',
                    column.enableSorting && !isLoading && 'cursor-pointer select-none',
                    i === 0 && 'rounded-l-full pl-8',
                    i === columns.length - 1 && 'rounded-r-full pr-8'
                  )}
                  onClick={() =>
                    !isLoading && column.enableSorting && toggleSort(column.accessorKey)
                  }
                >
                  <div className="flex items-center gap-1">
                    {isLoading ? (
                      renderHeaderSkeleton(column, i)
                    ) : (
                      <>
                        <Typography>{column.header}</Typography>
                        {column.enableSorting && (
                          <div className="flex flex-col">
                            <ChevronUp
                              className={cn(
                                'h-4 w-4 -mb-[3px]',
                                sortColumn === column.accessorKey && sortDirection === 'asc'
                                  ? 'text-primary'
                                  : 'text-gray-500'
                              )}
                            />
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 -mt-[3px] text-bold',
                                sortColumn === column.accessorKey && sortDirection === 'desc'
                                  ? 'text-primary'
                                  : 'text-gray-500'
                              )}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => {
              const symbol =
                row && typeof row === 'object' && 'symbol' in row
                  ? (row as { symbol: string }).symbol
                  : '';
              const isExpanded = expandedRows?.has(symbol) || false;

              return (
                <React.Fragment key={rowIndex}>
                  <TableRow
                    className={cn(rowIndex % 2 === 0 ? 'bg-card' : 'bg-[#28292C]', 'border-none')}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell
                        key={colIndex}
                        className={cn(
                          'py-4',
                          colIndex === 0 && 'rounded-l-lg pl-8',
                          colIndex === columns.length - 1 && 'rounded-r-lg pr-8'
                        )}
                      >
                        {isLoading
                          ? renderSkeletonOrCell(column)
                          : column.cell
                            ? column.cell({ row })
                            : String(row[column.accessorKey])}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Expandable Row Content */}
                  {!isLoading && renderExpandableContent && (
                    <TableRow className="border-none">
                      <TableCell colSpan={columns.length} className="pt-0 pb-3">
                        <div
                          className={cn(
                            'overflow-hidden transition-all duration-300 ease-out',
                            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                          )}
                        >
                          <div
                            className={cn(
                              'transform transition-all duration-300 ease-out',
                              isExpanded ? 'translate-y-0' : '-translate-y-2'
                            )}
                          >
                            {isExpanded && renderExpandableContent(symbol)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center items-center pt-4 px-5 pb-2 text-sm gap-4">
          <Button
            onClick={() => {
              if (currentPage > 1) setCurrentPage(currentPage - 1);
            }}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full bg-background transition-colors p-0',
              currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#29292c]'
            )}
          >
            <ChevronDown className="h-5 w-5 rotate-90" />
          </Button>
          <Typography className="font-medium">
            {currentPage} of {totalPages}
          </Typography>
          <Button
            onClick={() => {
              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
            }}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full bg-background transition-colors p-0',
              currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#29292c]'
            )}
          >
            <ChevronDown className="h-5 w-5 -rotate-90" />
          </Button>
        </div>
      )}
    </div>
  );
}
