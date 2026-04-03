import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Onboarding } from "./pages/Onboarding";
import { SignUp, Login, VerifyEmail } from "./pages/Auth";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { ListingDetail } from "./pages/ListingDetail";
import { RentRequest } from "./pages/RentRequest";
import { CreateListing } from "./pages/CreateListing";
import { Recycle } from "./pages/Recycle";
import { MyRequests } from "./pages/MyRequests";
import { MyListings } from "./pages/MyListings";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";

export const router = createBrowserRouter([
  { path: "/", Component: Onboarding },
  { path: "/signup", Component: SignUp },
  { path: "/login", Component: Login },
  { path: "/verify-email", Component: VerifyEmail },
  {
    Component: Layout,
    children: [
      { path: "/home", Component: Home },
      { path: "/browse", Component: Browse },
      { path: "/listing/:id", Component: ListingDetail },
      { path: "/rent/:id", Component: RentRequest },
      { path: "/create", Component: CreateListing },
      { path: "/recycle", Component: Recycle },
      { path: "/my-requests", Component: MyRequests },
      { path: "/my-listings", Component: MyListings },
      { path: "/profile", Component: Profile },
      { path: "/admin", Component: Admin },
    ],
  },
]);
