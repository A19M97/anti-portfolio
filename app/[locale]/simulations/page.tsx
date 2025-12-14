import { redirect } from "next/navigation";

export default function SimulationsPage() {
  // La pagina /simulations non deve più esistere
  // Redirect al profilo dell'utente
  redirect("/users/me");
}
