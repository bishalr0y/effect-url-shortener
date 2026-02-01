import { Layer } from "effect";
import { UserServiceLive } from "./services/user-service";
import { UrlServiceLive } from "./services/url-service";
import { UserRepositoryLive } from "./repositories/user-repository";
import { UrlRepositoryLive } from "./repositories/url-repository";

// Centralized dependency injection layer
export const userLayer = UserServiceLive.pipe(Layer.provide(UserRepositoryLive));
export const urlLayer = UrlServiceLive.pipe(Layer.provide(UrlRepositoryLive));

// Main application layer that combines all services
export const appLayer = Layer.mergeAll(userLayer, urlLayer);