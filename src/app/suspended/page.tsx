import React from 'react';
import Link from 'next/link';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Account Suspended
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your organization's access to VVSignage CMS has been temporarily suspended.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex justify-center">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Payment Overdue
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Please contact our support team to resolve this issue and restore your access.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <a 
              href="mailto:support@tropicair.com" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Email Support
            </a>
            <Link 
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
