import dynamic from "next/dynamic";
import LoadingScreen from "../components/LoadingScreen";

// Disable SSR for the app — recharts requires the browser DOM.
// loading: covers the gap while the NutritionApp chunk itself downloads —
// on a cold mobile connection this can be visible; without it, that gap
// renders blank (Next.js default), before NutritionApp's own internal
// loading screen ever gets a chance to mount.
const NutritionApp = dynamic(() => import("../components/NutritionApp"), {
  ssr: false,
  loading: () => <LoadingScreen/>,
});

export default function Home() {
  return <NutritionApp />;
}
