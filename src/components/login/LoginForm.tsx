"use client";

import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Importe todos os componentes do Form
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { signInSchema } from "@/lib/schemas"; // Importe seu schema e o tipo
import { cleanNumericString, formatCpfCnpj } from "@/utils/functions";
import { zodResolver } from "@hookform/resolvers/zod"; // Importe o zodResolver
import { Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form"; // Importe useForm
import { toast } from "sonner";
import z from "zod";

type LoginFormInputs = z.infer<typeof signInSchema>;

export default function LoginForm({
  notice,
  redirectTo,
}: {
  /** Aviso vindo de `?reason=` (sessão expirada, senha alterada…). */
  notice?: string;
  /** Rota interna (já validada) para voltar após o login. */
  redirectTo?: string | null;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  const [state, action, pending] = useActionState(signIn, undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(data: LoginFormInputs) {
    startTransition(() => {
      action(data);
    });
  }

  useEffect(() => {
    if (state?.message && state.errors) {
      toast.error(state.message);
      for (const [field, messages] of Object.entries(state.errors)) {
        form.setError(field as keyof LoginFormInputs, {
          type: "server",
          message: messages?.join(", "),
        });
      }
    } else if (state?.message && !state.errors) {
      toast.success(state.message);
      router.replace(redirectTo ?? "/market");
    }
  }, [state, form, router, redirectTo]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-2">
          Bem-vindo de volta
        </h2>
        <p className="text-sm text-center mb-6">
          Preencha as informações para acessar sua conta.
        </p>
        {notice && (
          <Alert className="border-primary/40 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="identifier">
                CPF ou CNPJ <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  id="identifier"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  type="text"
                  value={formatCpfCnpj(field.value)}
                  onChange={(e) => {
                    const val = cleanNumericString(e.target.value);
                    field.onChange(val);
                  }}
                  maxLength={18}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="password">
                Senha <span className="text-red-500">*</span>
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="Senha"
                    type={showPassword ? "text" : "password"}
                    {...field}
                    id="identifier"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[10px] text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full p-3 mt-4 h-12 text-white rounded font-medium bg-primary hover:bg-success transition"
          disabled={pending}
        >
          {pending ? "Aguarde" : "Entrar"}
        </Button>
        <Link
          href="/forgot-password"
          className="text-xs text-blue-600 text-right mt-2 block"
        >
          Esqueci minha senha
        </Link>

        <div className="relative text-center">
          <span className="relative z-10 bg-background px-2 text-xs text-gray-400">
            OU
          </span>
          <div className="absolute top-1/2 w-full border-t border-gray-300 z-0" />
        </div>

        <p className="text-center text-sm">
          Novo na Venda+?{" "}
          <Link href="/register" className="text-primary font-bold">
            Cadastre-se
          </Link>
        </p>
      </form>
    </Form>
  );
}
