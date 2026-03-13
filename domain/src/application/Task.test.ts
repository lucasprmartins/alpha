import { describe, expect, it } from "bun:test";
import type { TaskRepository } from "../contracts/Task";
import {
  InvalidTaskTransitionError,
  Task,
  TaskNotFoundError,
  TaskValidationError,
} from "../entities/Task";
import {
  CancelTask,
  CompleteTask,
  CreateTask,
  DeleteTask,
  ListTasks,
  ReopenTask,
  StartTask,
} from "./Task";

function createInMemoryRepository(): TaskRepository {
  const tasks = new Map<string, Task>();
  return {
    create(task) {
      tasks.set(task.id, task);
      return Promise.resolve();
    },
    delete(id) {
      tasks.delete(id);
      return Promise.resolve();
    },
    findAll() {
      return Promise.resolve([...tasks.values()]);
    },
    findById(id) {
      return Promise.resolve(tasks.get(id) ?? null);
    },
    update(task) {
      tasks.set(task.id, task);
      return Promise.resolve();
    },
  };
}

function createSeedTask(): Task {
  const result = Task.create({ title: "Tarefa seed" });
  if (!result.ok) {
    throw new Error("Falha ao criar seed");
  }
  return result.value;
}

describe("CreateTask", () => {
  it("cria e persiste uma tarefa", async () => {
    const repo = createInMemoryRepository();
    const useCase = new CreateTask(repo);

    const result = await useCase.execute({ title: "Nova tarefa" });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.title).toBe("Nova tarefa");

    const found = await repo.findById(result.value.id);
    expect(found).not.toBeNull();
  });

  it("retorna erro para título inválido", async () => {
    const repo = createInMemoryRepository();
    const useCase = new CreateTask(repo);

    const result = await useCase.execute({ title: "" });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
  });
});

describe("ListTasks", () => {
  it("retorna todas as tarefas", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    await repo.create(task);

    const useCase = new ListTasks(repo);
    const tasks = await useCase.execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe("Tarefa seed");
  });

  it("retorna array vazio quando não há tarefas", async () => {
    const repo = createInMemoryRepository();
    const useCase = new ListTasks(repo);
    const tasks = await useCase.execute();

    expect(tasks).toHaveLength(0);
  });
});

describe("StartTask", () => {
  it("inicia uma tarefa pendente", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    await repo.create(task);

    const useCase = new StartTask(repo);
    const result = await useCase.execute({ id: task.id });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.status).toBe("in_progress");
  });

  it("retorna erro para tarefa inexistente", async () => {
    const repo = createInMemoryRepository();
    const useCase = new StartTask(repo);

    const result = await useCase.execute({ id: "inexistente" });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskNotFoundError);
  });

  it("retorna erro para transição inválida", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    task.start();
    task.complete();
    await repo.create(task);

    const useCase = new StartTask(repo);
    const result = await useCase.execute({ id: task.id });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(InvalidTaskTransitionError);
  });
});

describe("CompleteTask", () => {
  it("conclui uma tarefa em progresso", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    task.start();
    await repo.create(task);

    const useCase = new CompleteTask(repo);
    const result = await useCase.execute({ id: task.id });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.status).toBe("completed");
    expect(result.value.completedAt).toBeInstanceOf(Date);
  });

  it("retorna erro para tarefa inexistente", async () => {
    const repo = createInMemoryRepository();
    const useCase = new CompleteTask(repo);

    const result = await useCase.execute({ id: "inexistente" });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskNotFoundError);
  });
});

describe("CancelTask", () => {
  it("cancela uma tarefa pendente com motivo", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    await repo.create(task);

    const useCase = new CancelTask(repo);
    const result = await useCase.execute({
      id: task.id,
      reason: "Não é mais necessário",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.status).toBe("cancelled");
    expect(result.value.cancellationReason).toBe("Não é mais necessário");
  });

  it("retorna erro para motivo vazio", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    await repo.create(task);

    const useCase = new CancelTask(repo);
    const result = await useCase.execute({ id: task.id, reason: "  " });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
  });
});

describe("ReopenTask", () => {
  it("reabre uma tarefa concluída", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    task.start();
    task.complete();
    await repo.create(task);

    const useCase = new ReopenTask(repo);
    const result = await useCase.execute({ id: task.id });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.status).toBe("pending");
    expect(result.value.completedAt).toBeNull();
  });

  it("reabre uma tarefa cancelada", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    task.cancel("Engano");
    await repo.create(task);

    const useCase = new ReopenTask(repo);
    const result = await useCase.execute({ id: task.id });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.status).toBe("pending");
    expect(result.value.cancelledAt).toBeNull();
    expect(result.value.cancellationReason).toBeNull();
  });

  it("retorna erro para tarefa pendente", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    await repo.create(task);

    const useCase = new ReopenTask(repo);
    const result = await useCase.execute({ id: task.id });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(InvalidTaskTransitionError);
  });
});

describe("DeleteTask", () => {
  it("exclui uma tarefa existente", async () => {
    const repo = createInMemoryRepository();
    const task = createSeedTask();
    await repo.create(task);

    const useCase = new DeleteTask(repo);
    const result = await useCase.execute({ id: task.id });

    expect(result.ok).toBe(true);
    const found = await repo.findById(task.id);
    expect(found).toBeNull();
  });

  it("retorna erro para tarefa inexistente", async () => {
    const repo = createInMemoryRepository();
    const useCase = new DeleteTask(repo);

    const result = await useCase.execute({ id: "inexistente" });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskNotFoundError);
  });
});
