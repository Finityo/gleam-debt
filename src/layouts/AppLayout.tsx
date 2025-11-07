import { NavDrawer } from "@/components/NavDrawer";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <NavDrawer />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 pb-20 pt-8">
        {children}
      </main>
    </div>
  );
}
