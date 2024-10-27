import {
  createMemo,
  createSignal,
  For,
  Show,
  type VoidComponent,
} from "solid-js";

import { db } from "~/server/db";
import { cache, createAsync, useAction, useSubmissions } from "@solidjs/router";

const getTodos = cache(async () => {
  "use server";

  return await db.todo.findMany();
}, "todos");

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

export const route = {
  async preload() {
    await getTodos();
  },
};

const Home: VoidComponent = () => {
  const todos = createAsync(() => getTodos());
  const [text, setText] = createSignal("");
  const createSubmissions = useSubmissions(createToDo);
  const updateToDo = useAction(update);
  const updateSubmissions = useSubmissions(update);

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

  return (
    <main class="flex min-h-screen flex-col gap-4 items-center py-12 bg-gradient-to-b from-[#026d56] to-[#152a2c]">
      <div class="w-full flex gap-2 items-center justify-center flex-wrap">
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
                  !!updateSubmissions.find(
                    (e) => e.pending && e.input[1] === todo.id
                  )
                }
              />
            </div>
          )}
        </For>
      </div>
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
    </main>
  );
};

export default Home;
