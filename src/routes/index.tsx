import { For, type VoidComponent } from "solid-js";

import { db } from "~/server/db";
import { cache, createAsync } from "@solidjs/router";

const getTodos = cache(async () => {
  "use server";

  return await db.todo.findMany();
}, "todos");

export const route = {
  async preload() {
    await getTodos();
  },
};

const Home: VoidComponent = () => {
  const todos = createAsync(() => getTodos());
  return (
    <main class="flex min-h-screen flex-col gap-4 items-center py-12 bg-gradient-to-b from-[#026d56] to-[#152a2c]">
      <div class="w-full flex gap-2 items-center justify-center flex-wrap">
        <For each={todos()}>
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

export default Home;
