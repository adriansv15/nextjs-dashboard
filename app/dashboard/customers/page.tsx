import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/customers/table';
import { CreateCustomer } from '@/app/ui/customers/buttons';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
// import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { fetchFilteredCustomers } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customers',
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const formattedCustomersTable = await fetchFilteredCustomers(query)
//   const currentPage = Number(searchParams?.page) || 1;
//   const totalPages = await fetchInvoicesPages(query);

  return (
    <div className="w-full">
      {/* <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}> */}
       {/* <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
          <Search placeholder="Search invoices..." />
          <CreateCustomer />
        </div> */}
      <Suspense key={query}>
        {/* <Table query={query} currentPage={currentPage} /> */}
        <Table customers={formattedCustomersTable} />
      </Suspense>
    </div>
  );
}