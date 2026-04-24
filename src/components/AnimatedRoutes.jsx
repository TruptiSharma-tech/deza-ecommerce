import React from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageWrapper from "./PageWrapper";

const AnimatedRoutes = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <PageWrapper key={location.pathname}>
        {children}
      </PageWrapper>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
