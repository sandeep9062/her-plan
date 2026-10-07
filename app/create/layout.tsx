import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make your own invite 💌",
  description: "Make your own cute date invite link to share with someone special.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
