'use client';

import { ReactNode } from 'react';
import MainNavbar from '../components/layout/MainNavbar';

export default function RootTemplate({ children }: { children: ReactNode }) {
  return (
    <>
      <MainNavbar />
      {children}
    </>
  );
}
