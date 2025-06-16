import AuthForm from "@/components/AuthForm";
import { queryClient } from "@/lib/queryClient";

export default function Landing() {
  const handleAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    window.location.reload();
  };

  return <AuthForm onSuccess={handleAuthSuccess} />;
}