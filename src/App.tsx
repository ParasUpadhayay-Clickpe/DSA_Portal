import AppRouter from "./router/AppRouter";
import { RoleProvider } from "./contexts/RoleContext";

function App() {
  return (
    <RoleProvider>
      <AppRouter />
    </RoleProvider>
  );
}

export default App;
