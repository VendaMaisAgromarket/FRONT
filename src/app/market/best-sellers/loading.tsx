import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-dvh w-dvw flex items-center justify-center">
      <LoaderCircle size={40} className="text-primary animate-spin" />
    </div>
  );
}
