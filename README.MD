# Data Loading

SolidStart has built in methods to fetch and manage your data while also keeping your UI updated. In this guide we are going to talk and explain about how data should be loaded in SolidStart, how to trigger Suspense, create server actions & server data loaders. We are also going to learn about optimistic updates and all the existing methods.

## Table Of Content

First lets understand the SolidStart Data API. Please read each section carefully starting with Route Data.

- [Route Data](#Route-Data)
  - [Server Route Data](#Server-Route-Data)
  - [createAsync & Suspense](#createAsync)
    - [Server Async Data](#Server-Async-Data)
  - [cache](#cache)
    - [key](#key)
    - [keyFor](#keyFor)
  - [preload](#preload)
    - [Preload Server Data](#preloading-server-data)
- [Actions](#Actions)
  - [SSR Note](#note-form--ssr)
  - [Using A Form](#Using-A-Form)
    - [.with](#with)
  - [Using useAction](#Using-useAction)
  - [Server Actions](#Server-Actions)
  - [Revalidation](#Revalidating-Data--Preloaded-Data)
    - [Using A Response](#returning-a-response-from-the-action)
    - [Using The revalidate Function](#Using-The-revalidate-Function)
    - [Prevent Default Revalidation](#Disable-Revalidation)
  - [Optimistic Updates](#Optimistic-Updates)
    - [useSubmission](#useSubmission)
      - [filter](#Using-A-Filter)
      - [Video Of Usage](#Video-Of-Usage)
    - [useSubmissions](#useSubmissions)
      - [filter](#Using-A-Filter1)
      - [Video Of Usage](#Video-Of-Usage1)

After learning the basics, ahead over to the [ToDo App](#todo-app) section to see how we can create a fully functioning app with Optimistic Updates & Server Actions in SolidStart.

- [ToDo App](#todo-app)
  - [Demo](#video)
  - [Installation](#install)
  - [Prefetching The ToDo List](#prefetching-the-todo-list)
  - [Create ToDo](#create-todo-action)
  - [Update Todo](#update-todo-status)
    - [Optimistic Updates](#optimistic-updates-1)

# Route Data

When wanting to preload data or run some logic like protected route or setting cookies / headers, we can use the `preload` function to define a route data function
Route data is an object that contains the [`preload`](#preload) function you can export from a route (a page: i.e routes/index.tsx) in order to load / preload data. This is also valid for server functions, so you could get a csrf cookie and set it before the page is sent to the client.

When using routeData, you must provide a `preload` function and consume it by using `createAsync`, please read [createAsync](#createasync) and [preload](#preload), you can also use [cache](#cache) to cache your data functions.

```ts
import { cache } from "@solidjs/router";

const myFn = cache(async () => {
  return [1, 2, 3];
}, "myFn");

export const route = {
  preload: () => {
    myFn();
  },
};
```

## preload

The preload function is called once per route, which is the first time the user comes to that route.
Using preload functions, fetching the data parallel to loading the route is possible to allow use of the data as soon as possible.
The preload function can be called when the Route is loaded or eagerly when links are hovered.

Once the preload function is set, we can use [createAsync](#createasync) to get the data (like in this example).

In this example, we are going to hit up the `/api/notes` endpoint and return the data we received.

```tsx
import { Suspense, type VoidComponent } from "solid-js";
import { cache, createAsync } from "@solidjs/router";
import { isServer } from "solid-js/web";

const myFn = cache(async () => {
  return await fetch(
    isServer ? "http://localhost:3000/api/notes" : "/api/notes"
  ).then((r) => r.json() as unknown as number[]);
}, "myFn");

export const route = {
  preload: () => {
    myFn();
  },
};

const Home: VoidComponent = () => {
  const data = createAsync(async () => myFn());
  return (
    <Suspense>
      <main>
        <pre>{data()?.join(",")}</pre>
      </main>
    </Suspense>
  );
};

export default Home;
```

In the example above, the data returns instantly, but we can even make it more intrensting by adding a timeout so we can actually see the `Suspense` working.

```ts
const myFn = cache(async () => {
  await new Promise((resolve) =>
    setTimeout(() => {
      resolve(undefined);
    }, 3000)
  );
  return await fetch(
    isServer ? "http://localhost:3000/api/notes" : "/api/notes"
  ).then((r) => r.json() as unknown as number[]);
}, "myFn");
```

The `Home` page will only be rendered after 3 seconds using this Promise `setTimeout` with the Suspense.

### Preloading Server Data

You can create a server function using the `"use server";` pragma, then call it (as you would call a regular function).

```ts
const myFn = cache(async () => {
  "use server";

  return await fetch(
    isServer ? "http://localhost:3000/api/notes" : "/api/notes"
  ).then((r) => r.json() as unknown as number[]);
}, "myFn");

export const route = {
  preload: () => {
    myFn();
  },
};
```

## Server Route Data

Using the `"use server";` pragma you can turn this function to a server function, the client use case stays exactly the same, we just add this line.

```ts
import { cache } from "@solidjs/router";

const myFn = cache(async () => {
  "use server";

  return [1, 2, 3];
}, "myFn");

export const route = {
  preload: () => {
    myFn();
  },
};
```

## createAsync

createAsync is a function that transforms an async function into a signal that could be used to read the data returned from the promise & trigger Suspense/Transitions.
createAsync is the main function you should be using when interacting with the data API.

```tsx
import { myFnPromise } from "@/somewhere";

const Home: VoidComponent = () => {
  const data = createAsync(async () => await myFnPromise());
  return (
    <Suspense fallback="Loading...">
      <main>
        {/* Reading data() triggers the Suspense*/}
        <pre>{data()}</pre>
      </main>
    </Suspense>
  );
};
```

You can also use the `createAsync` method with [preloaded](#preload) functions but you can also use a server function or any function you want.

### Server Async Data

You can create a server function using the `"use server";` pragma, then call it (as you would call a regular function) using createAsync to render the data on the client side.

```tsx
import { Suspense, type VoidComponent } from "solid-js";
import { cache, createAsync } from "@solidjs/router";

const myServerFn = cache(async () => {
  "use server";

  console.log("on server");
  return [1, 2, 3];
}, "myServerFn");

const Home: VoidComponent = () => {
  const data = createAsync(async () => myServerFn());
  return (
    <Suspense>
      <main>
        <pre>{data()?.join(",")}</pre>
      </main>
    </Suspense>
  );
};

export default Home;
```

## cache

cache is a higher-order function designed to create a new function with the same signature as the function passed to it. When this newly created function is called for the first time with a specific set of arguments, the original function is run, and its return value is stored in a cache and returned to the caller of the created function. The next time the created function is called with the same arguments (as long as the cache is still valid), it will return the cached value instead of re-executing the original function.

This function is being used to cache returned data from a function and try to minimize the unnecessary function calls

Cached functions also provide utils that are useful when retrieving the keys used in cases involving [invalidation](#revalidating-data--preloaded-data): [.key](#key) and [.keyFor](#keyFor)

```ts
import { cache } from "@solidjs/router";

const cachedFn = cache(fn, key);

// ie
const myFn = cache(({ count }: { count: number }) => {
  return count === 2 ? [4, 5, 6] : [1, 2, 3];
}, "myFn");
```

In the following example there are two examples functions. One is cached and one is not

```ts
import { cache } from "@solidjs/router";

const nonCachedFn = async () => {
  console.log("called");
  const data = await fetch("/api/notes").then((d) => d.json());
  return data;
};

const cachedFn = cache(() => {
  console.log("called");
  const data = await fetch("/api/notes").then((d) => d.json());
  return data;
}, "uniqueKey");
```

When we call `cachedFn` the first time it will actually console log `called`, but when we call it the second time, it will not print anything, matter of fact it will not even make the request to `/api/notes`, that is because the data returned from it is cached, meaning Solid is smart enough to return the latest data received from this function instead of re-trigerring it.

```ts
cachedFn(); // prints called
cachedFn(); // doesn't print anything but returns the data fetched from the previous call (line above)
```

If we call `nonCachedFn` which is not cached, it will print called every call.

```ts
nonCachedFn(); // prints called
nonCachedFn(); // prints called
nonCachedFn(); // prints called
```

### Server functions with cache

You can create a server function using the `"use server";` pragma, then you call `cache` like you would with a regular function.

```ts
const cachedFn = cache((name: string) => {
  "use server";

  console.log("called on server", name);
  const data = await fetch("http://localhost:3000/api/notes").then((d) =>
    d.json()
  );
  return data;
}, "uniqueKey");
```

Cached functions provide utils that are useful when retrieving the keys used in cases involving invalidation:

### .key

Getting the key of a cached function, useful for revalidating all the data() calls for this function.

```ts
const key = cachedFn.key; // "uniqueKey"
```

After getting the key you can invalidate all calls by doing:

```ts
import { revalidate } from "@solidjs/router";

revalidate(cachedFn.key);
```

Read more about [Data Revalidation](#revalidating-data--preloaded-data)

### .keyFor

Getting a specific key from a cached function for a specific input, useful for revalidating the data() call for this specific input on this specific function.

```ts
const key = cachedFn.keyFor("OrJDev"); // ["uniqueKey", "OrJDev"]
```

After getting the key you can invalidate this specific call by doing:

```ts
import { revalidate } from "@solidjs/router";

revalidate(cachedFn.keyFor("OrJDev"));
```

Read more about [Data Revalidation](#revalidating-data--preloaded-data)

# Actions

An action is a function you may use to mutate data, meaning when you want to send, update, delete or interact with a server / lib. This is considered to be a `mutation`.
Actions only work with the `POST` request method, this means forms require `method="post"`
By default all cached functions will be revalidated (re-fetched), event if the action does or doesn't return response, you can change this behavior, read more [here](#disable-revalidation)

To create an action you simply call the `action` method from Solid Router.

```ts
import { action, redirect } from "@solidjs/router";

const fn = action(myFunction, myUniqueName);

const callWithForm = action(async (formData: FormData) => {
  const name = formData.get("name")!;
  console.log(`Hey ${name}`);
  return redirect("/success");
}, "myUniqueName");

const callWithString = action(async (name: string) => {
  console.log(`Hey ${name}`);
  return redirect("/success");
}, "myUniqueName");

const callWithRevalidation = action(async () => {
  return redirect("/some-page", { revalidate: "abcd" });
}, "myUniqueName");
```

## Note (Form + SSR)

This requires stable references because a string can only be serialized as an attribute, and it is crucial for consistency across SSR. where these references must align. The solution is to provide a unique name. Meaning, you always have to provide a second argument when you call `action`

```ts
action(fn, key); // cool
action(fn); // not cool
```

You can either use a Form to call an action or use the `useAction` hook from Solid Router.

## Using A Form

```tsx
import { type VoidComponent } from "solid-js";
import { action, redirect } from "@solidjs/router";

const callWithParams = action(async (formData: FormData) => {
  const name = formData.get("name")!;
  console.log(`Hey ${name}`);
  return redirect("/success");
}, "myMutation");

const Home: VoidComponent = () => {
  return (
    <main>
      <form action={callWithParams} method="post">
        <input type="hidden" name="name" value={"OrJDev"} />
        <button type="submit">Call</button>
      </form>
    </main>
  );
};

export default Home;
```

### .with

Actions have a `with` method, this method can be used when typed data is required. This removes the need to use `FormData` or other additional hidden fields. The with method works similar to bind, which applies the arguments in order.

```tsx
import { type VoidComponent } from "solid-js";
import { action, redirect } from "@solidjs/router";

const callWithParams = action(async (name: string) => {
  console.log(`Hey ${name}`);
  return redirect("/success");
}, "myMutation");

const Home: VoidComponent = () => {
  return (
    <main>
      <form action={callWithParams.with("OrJDev")} method="post">
        <button type="submit">Call</button>
      </form>
    </main>
  );
};

export default Home;
```

As you can see, no `FormData` was involved in this action.

## Using useAction

If you don't want to use a form, you can use the `useAction` hook from Solid Router. This consumes the action and return a function you can call from anywhere, with any params you would like.

```tsx
import { type VoidComponent } from "solid-js";
import { action, redirect, useAction } from "@solidjs/router";

const callWithParams = action(async (name: string) => {
  console.log(`Hey ${name}`);
  return redirect("/success");
}, "myMutation");

const Home: VoidComponent = () => {
  const myAction = useAction(callWithParams);
  return (
    <main>
      <button onClick={() => myAction("OrJDev")}>Call</button>
    </main>
  );
};

export default Home;
```

## Server Actions

You can create a server function using the `"use server";` pragma, then you call `action` like you would with a regular function.

```ts
import { action, redirect } from "@solidjs/router";

const callWithParams = action(async (name: string) => {
  "use server";

  // this is printed on the server
  console.log(`Hey ${name}`);
  return redirect("/success");
}, "myMutation");
```

## Disable Revalidation

By default all cached functions will be revalidated (re-fetched), event if the action does or doesn't return response. You can change this by returning a string as the `revalidate` key.

```ts
import { action, redirect } from "@solidjs/router";

const callWithParams = action(async (name: string) => {
  console.log(`Hey ${name}`);
  return redirect("/success", { revalidate: "nothing" });
}, "myMutation");
```

## Revalidating Data / Preloaded Data

Assuming we have a [cached](#cache) function called `myFn`, we can invalidate its data by either:

### Returning A Response From The Action

By returning a response from the action, we can choose which keys to invalidate (if we want any).

```ts
import { action, json, reload, redirect } from "@solidjs/router";

const mutateMyFn = action(async (formData: FormData) => {
  const name = Number(formData.get("name"));
  await mutateData(name); // assuming we changed something
  return json({ done: name }, { revalidate: ["myFn"] });

  //or
  return reload({
    revalidate: ["myFn"],
  });

  //or
  return redirect("/", {
    revalidate: ["myFn"],
  });
});
```

A key could also be:

```ts
return redirect("/", {
  revalidate: ["getAllTodos", getTodos.key, getTodoByID.keyFor(id)],
});
```

### Using The revalidate Function

Assuming we don't want to define the revalidation logic within the action itself, we can also invalidate it from anywhere we want, so we can use the `revalidate` function from Solid Router.

```ts
import { revalidate } from "@solidjs/router";
revalidate([getTodos.key, getTodoByID.keyFor(id)]);
```

## Optimistic Updates

Optimistic updates are crucial for the best dx, they are used to display the data as if it has already been received while its still fetching the actual data in the background. So the user thinks that our server is fast, while the action is still running.

Assuming we have this action:

```ts
const callWithParams = action(async (name: string) => {
  console.log(`Hey ${name}`);
  await new Promise((resolve) =>
    setTimeout(() => {
      resolve(undefined);
    }, 3000)
  );
  return `Hey ${name}`;
}, "myMutation");
```

When using [action](#Actions) and wanting to implement optimistic updates, you must use one of the following:

### useSubmission

This function takes two arguments:

1.  action - The action we created before
2.  filter - Optionally filter out this hook for certain inputs - `([name]) => name !== "OrJDev";`

After that, it returns useful data & functions such as `clear`, `input`, `result`, `pending`, `error` and more.

We can use the input property to try and set the optimistic data.

```tsx
import { Show, type VoidComponent } from "solid-js";
import { useSubmission } from "@solidjs/router";

const Home: VoidComponent = () => {
  const submit = useSubmission(callWithParams);
  return (
    <main>
      <form action={callWithParams.with("OrJDev")} method="post">
        <button disabled={submit.pending} type="submit">
          {submit.pending ? "Calling" : "Call"}
        </button>
      </form>
      <Show when={submit.error}>
        <div>Error</div>
      </Show>
      <Show when={submit.input?.[0]}>
        {(name) => <div>Optimistic {`Hey ${name()}`}</div>}
      </Show>
      <Show when={submit.result}>{(text) => <div>Result {text()}</div>}</Show>
    </main>
  );
};

export default Home;
```

So in this example, using the `input` and the `result` property, the optimistic is going to be rendered instantly, while the result returned from the function is going to be rendered after 3 seconds!

You can also use the other methods to modify the state of this submission

```tsx
const SomeUtils = () => {
  return (
    <div>
      <button onClick={() => submit.retry()}>Retry</button>
      <button onClick={() => submit.clear()}>Clear</button>
    </div>
  );
};
```

#### Using A Filter

In this example, we are going to filter out the fake JDev out there, yack

```tsx
import { Show, type VoidComponent } from "solid-js";
import { useSubmission } from "@solidjs/router";

const Home: VoidComponent = () => {
  const submit = useSubmission(callWithParams, ([name]) => {
    return name !== "FakeJD";
  });
  return (
    <main>
      <form action={callWithParams.with("OrJDev")} method="post">
        <button disabled={submit.pending} type="submit">
          {submit.pending ? "Calling" : "Call"}
        </button>
      </form>
      <form action={callWithParams.with("FakeJD")} method="post">
        <button disabled={submit.pending} type="submit">
          Call Fake JDev
        </button>
      </form>
      <Show when={submit.error}>
        <div>Error</div>
      </Show>
      <Show when={submit.input?.[0]}>
        {(name) => <div>Optimistic {`Hey ${name()}`}</div>}
      </Show>
      <Show when={submit.result}>{(text) => <div>Result {text()}</div>}</Show>
    </main>
  );
};

export default Home;
```

When calling this function with `FakeJD` as the name, all the proprties will remain null and will not be rendered (input,error, etc), if we call it with any other name, it will be rendered instantly.

#### Video Of Usage

[![Demo](https://github-production-user-asset-6210df.s3.amazonaws.com/91349014/379047774-ebc79b96-54aa-464f-844f-81c74c3e5b76.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20241022%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20241022T233538Z&X-Amz-Expires=300&X-Amz-Signature=3aa100e2515e154097da15b37c7c97aeace4ed246d391ca9693bb162a21e5da3&X-Amz-SignedHeaders=host)](https://github.com/user-attachments/assets/45973a6a-f841-4677-b0e0-c556a3ab353c)

### useSubmissions

This function is similar to [usesSbmission](#usesubmission), except instead of returning one single object with the submission properties (input,result,etc), it returns an array of all the submissions for this action. So instead of:

```ts
{
  input: any;
  error: any;
}
```

its:

```ts
Array<{
  input: any;
  error: any;
}>;
```

This function takes two arguments:

1.  action - The action we created before
2.  filter - Optionally filter out this hook for certain inputs - `([name]) => name !== "OrJDev";`

```tsx
import { For, Show, type VoidComponent } from "solid-js";
import { useSubmissions } from "@solidjs/router";

const Home: VoidComponent = () => {
  const submits = useSubmissions(callWithParams);
  return (
    <main>
      <form action={callWithParams.with("OrJDev")} method="post">
        <button disabled={submits.pending} type="submit">
          {submits.pending ? "Calling" : "Call"}
        </button>
      </form>
      <For each={[...submits.entries()]}>
        {([attempt, data]) => {
          return (
            <div>
              <Show when={data.error}>
                <div>Error {attempt}</div>
              </Show>
              <Show when={data.input?.[0]}>
                {(name) => (
                  <div>
                    Optimistic {attempt} {`Hey ${name()}`}
                  </div>
                )}
              </Show>
              <Show when={data.result}>
                {(text) => (
                  <div>
                    Result {attempt} {text()}
                  </div>
                )}
              </Show>
            </div>
          );
        }}
      </For>
    </main>
  );
};

export default Home;
```

So in this example, using the `input` and the `result` property, the optimistic is going to be rendered instantly, while the result returned from the function is going to be rendered after 3 seconds!

#### Using A Filter

In this example, we are going to filter out the fake JDev out there, yack

```tsx
import { For, Show, type VoidComponent } from "solid-js";
import { useSubmissions } from "@solidjs/router";

const Home: VoidComponent = () => {
  const submits = useSubmissions(callWithParams, ([name]) => {
    return name !== "FakeJD";
  });
  return (
    <main>
      <form action={callWithParams.with("OrJDev")} method="post">
        <button disabled={submits.pending} type="submit">
          {submits.pending ? "Calling" : "Call"}
        </button>
      </form>
      <form action={callWithParams.with("FakeJD")} method="post">
        <button disabled={submits.pending} type="submit">
          Call Fake JDev
        </button>
      </form>

      <For each={[...submits.entries()]}>
        {([attempt, data]) => {
          return (
            <div>
              <Show when={data.error}>
                <div>Error {attempt}</div>
              </Show>
              <Show when={data.input?.[0]}>
                {(name) => (
                  <div>
                    Optimistic {attempt} {`Hey ${name()}`}
                  </div>
                )}
              </Show>
              <Show when={data.result}>
                {(text) => (
                  <div>
                    Result {attempt} {text()}
                  </div>
                )}
              </Show>
            </div>
          );
        }}
      </For>
    </main>
  );
};

export default Home;
```

When calling this function with `FakeJD` as the name, all the properties will remain null and will not be rendered (input,error, etc), if we call it with any other name, it will be rendered instantly.

#### Video Of Usage

[![Demo](https://github-production-user-asset-6210df.s3.amazonaws.com/91349014/379047355-a06af32e-947c-4a74-a295-404057718f53.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20241022%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20241022T233500Z&X-Amz-Expires=300&X-Amz-Signature=778c51ca9ffa73fd5457bbe0e613ad2fb5b9988215415a3c8107578914a93e16&X-Amz-SignedHeaders=host)](https://github.com/user-attachments/assets/de2f78ef-29e3-4bf4-93c1-0b937692534c)

# ToDo App

Lets use what we learned and build a fully functioning ToDo App in SolidStart.

## Install

First, lets clone the ToDo app template (which already includes the db configuration):

```sh
git clone git@github.com:OrJDev/solidstart-data.git todo-app
```

After that intall the dependencies:

```sh
pnpm install
```

And then create a `.env` file with:

```
DATABASE_URL=file:./db.sqlite
```

## Video

[![Demo](https://github.com/user-attachments/assets/a4581cfb-83b5-4fd1-a3b9-c4424ae56cc3)](https://github.com/user-attachments/assets/da621f3f-222c-426d-93ed-cc7ac5523dd6)

We can start building the actual app.

## Prefetching The ToDo List

Ahead over to `routes/index.tsx` and add the following preload method (this is going to pre-load the todo list and trigger Suspense)

First lets create the `getTodos` function, since we use the db directly to fetch the todos, we need to mark this function as server function:

```ts
import { db } from "~/server/db";
import { cache } from "@solidjs/router";

const getTodos = cache(async () => {
  "use server";

  return await db.todo.findMany();
}, "todos");
```

After creating this function, we can use and export the `preload` method in order to load the todos list before the page is actually sent to the client:

```ts
export const route = {
  async preload() {
    await getTodos();
  },
};
```

We need to consume this function and trigger Suspense by using `createAsync`.

```tsx
import { createAsync } from "@solidjs/router";

const Home: VoidComponent = () => {
  const todos = createAsync(() => getTodos());
  return (
    <main class="flex min-h-screen flex-col gap-4 items-center py-12 bg-gradient-to-b from-[#026d56] to-[#152a2c]">
      <div class="w-full flex gap-2 items-center justify-center flex-wrap">
        <For each={actualToDos()}>
          {(todo) => (
            <div class="flex flex-col gap-2 items-center border p-3 border-gray-500 rounded-lg">
              <span class="text-xl font-bold text-gray-300">{todo.text}</span>
              <input type="checkbox" checked={todo.completed} />
            </div>
          )}
        </For>
      </div>
    </main>
  );
};
```

By reading `todos()` we trigger suspense (as mentioned in the [createAsync](#createasync) guide).

After that we can implement the `createToDo` action.

## Create ToDo Action

We are going to create a server action that takes in a formData, it validates that the formData has `text`, after that it creates a new todo with the provided text. Once the todo is created, we are to going to invalidate the `getTodos` method we preloaded eariler, meaning we are going to refetch the todo list . We are also going to wait 2 seconds before revalidation so we can see the optimistic updates in action.

```ts
import { revalidate, action } from "@solidjs/router";

const createToDo = action(async (formData: FormData) => {
  "use server";

  const text = formData.get("text");
  if (!text || typeof text !== "string") {
    throw new Error("Missing Text");
  }
  await db.todo.create({ data: { text } });
  await new Promise((res) =>
    setTimeout(() => {
      res(undefined);
    }, 2000)
  );
  await revalidate(getTodos.key);
}, "createToDo");
```

Having the action ready, we can create a form that will trigger this action:

```tsx
import { useSubmissions } from "@solidjs/router";
import { createSignal } from "solid-js";

const CreateToDo = () => {
  const [text, setText] = createSignal("");
  const createSubmissions = useSubmissions(createToDo);
  return (
    <form
      action={createToDo}
      method="post"
      class="flex flex-col gap-4 items-center text-white text-lg"
    >
      <input
        type="text"
        placeholder="Text"
        class="outline-none border-gray-400 bg-inherit border border-solid rounded-lg p-3 text-white font-bold"
        name="text"
        value={text()}
        onChange={(e) => setText(e.currentTarget.value)}
      />
      <button
        disabled={createSubmissions.pending}
        type="submit"
        class="font-bold text-2xl text-orange-400"
      >
        Create ToDo
      </button>
    </form>
  );
};
```

This form will be used to create new todos.

## Update ToDo Status

First lets create an action that takes in two args, one is the checked value (if the todo is completed or not) and the other is the id of the todo.

```ts
const update = action(async (chcked: boolean, id: string) => {
  "use server";

  await db.todo.update({
    where: { id },
    data: {
      completed: chcked,
    },
  });
  await new Promise((res) =>
    setTimeout(() => {
      res(undefined);
    }, 2000)
  );
  await revalidate(getTodos.key);
}, "updateToDo");
```

After creating this action, we can use it to update a todo. Since the todo completed value is stored within a `checkbox` we won't use a form but rather the `useAction` function, we will also be using the `useSubmissions` hook for optimistic updates & check if function is pending.

First lets switch the way we render the current todo:

```tsx
import { useAction } from "@solidjs/router";

const updateToDo = useAction(update);

<For each={actualToDos()}>
  {(todo) => (
    <div class="flex flex-col gap-2 items-center border p-3 border-gray-500 rounded-lg">
      <span class="text-xl font-bold text-gray-300">{todo.text}</span>
      <input
        onClick={(e) => {
          e.preventDefault();
          updateToDo(e.currentTarget.checked, todo.id);
        }}
        type="checkbox"
        checked={todo.completed}
        disabled={
          !!updateSubmissions.find((e) => e.pending && e.input[1] === todo.id)
        }
      />
    </div>
  )}
</For>;
```

We are using `e.preventDefault()` so it will not display the checkmark until the server has completed, also we are using `disabled={...}` to check if we are already trying to update the current todo by filtering the id & pending status.

### Optimistic Updates

Because we purposely added a timeout in the server to stimulate slow response, lets implement optimistic updates mechanism (predicting the response of the server) to make this faster. To achieve this, we are going to use the `useSubmissions` hook.

```ts
const updateSubmissions = useSubmissions(update);
```

Hvaing the submisions, we can create a new memo called `actualTodos` which will be a combination of the todos returned from the server & the optimistic todos.

```ts
import { createMemo } from "solid-js";

const actualToDos = createMemo(() => {
  const t = todos();
  if (!updateSubmissions.pending) return t;
  return t?.map((todo) => {
    const exists = updateSubmissions.find(
      (e) => e.pending && e.input[1] === todo.id
    );
    if (exists) {
      return {
        ...todo,
        completed: exists.input[0],
      };
    }
    return todo;
  });
});
```

We are checking if there are any update todo submissions, if not return the todos returned from the server. If there are, we are going to map the todos returned from the server and compare it with the submissions. We will search if `updateSubmissions` has a todo with the id of the current todo, if so return the input of it (the completed boolean).
