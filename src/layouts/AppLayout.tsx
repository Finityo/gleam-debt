import { NavDrawer } from "@/components/NavDrawer";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex bg-background text-foreground w-full">
      <NavDrawer />
      
      <main className="flex-1 w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pb-20 pt-6 sm:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
