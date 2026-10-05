import React from "react";
import { FiArchive, FiCreditCard, FiDollarSign, FiSmartphone } from "react-icons/fi";

const iconMap = {
  cash: FiDollarSign,
  mobile: FiSmartphone,
  card: FiCreditCard,
  bank: FiArchive,
  savings: FiArchive,
};

const WalletIcon = ({ type, className = "h-4 w-4" }) => {
  const Icon = iconMap[type] ?? FiDollarSign;
  return <Icon className={className} aria-hidden="true" />;
};

export default WalletIcon;
