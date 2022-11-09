import React from "react";
import { Header } from "./header";
import { Nav } from "./nav";

export type PageComponents = {
  Nav: typeof Nav;
  Header: typeof Header;
};

interface PageProps {
  children?: React.ReactNode;
}

export const Page: PageComponents & ((props: PageProps) => JSX.Element) = ({
  children,
}) => {
  return <>{children}</>;
};

Page.Nav = Nav;
Page.Header = Header;
