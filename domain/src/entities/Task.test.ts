import { describe, expect, it } from "bun:test";
import { InvalidTaskTransitionError, Task, TaskValidationError } from "./Task";

function createTask(overrides?: { title?: string; description?: string }) {
  const result = Task.create({
    title: overrides?.title ?? "Comprar mantimentos",
    description: overrides?.description,
  });
  if (!result.ok) {
    throw new Error(`Falha ao criar tarefa: ${result.error.message}`);
  }
  return result.value;
}

describe("Task.create", () => {
  it("cria uma tarefa com valores padrão", () => {
    const result = Task.create({ title: "Comprar mantimentos" });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const task = result.value;
    expect(task.title).toBe("Comprar mantimentos");
    expect(task.description).toBeNull();
    expect(task.status).toBe("pending");
    expect(task.priority).toBe("medium");
    expect(task.dueDate).toBeNull();
    expect(task.completedAt).toBeNull();
    expect(task.cancelledAt).toBeNull();
    expect(task.cancellationReason).toBeNull();
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it("cria uma tarefa com todas as opções", () => {
    const dueDate = new Date(Date.now() + 86_400_000);
    const result = Task.create({
      title: "Fazer deploy",
      description: "Deploy em produção",
      priority: "urgent",
      dueDate,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.title).toBe("Fazer deploy");
    expect(result.value.description).toBe("Deploy em produção");
    expect(result.value.priority).toBe("urgent");
    expect(result.value.dueDate).toEqual(dueDate);
  });

  it("rejeita título vazio", () => {
    const result = Task.create({ title: "" });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
    expect(result.error.message).toBe("O título não pode ser vazio");
  });

  it("rejeita título com apenas espaços", () => {
    const result = Task.create({ title: "   " });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
  });

  it("rejeita título com mais de 200 caracteres", () => {
    const result = Task.create({ title: "a".repeat(201) });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
    expect(result.error.message).toContain("200");
  });

  it("rejeita data limite no passado", () => {
    const result = Task.create({
      title: "Tarefa",
      dueDate: new Date(Date.now() - 86_400_000),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
    expect(result.error.message).toContain("futuro");
  });
});

describe("Transições de estado", () => {
  it("pending -> in_progress via start()", () => {
    const task = createTask();
    const result = task.start();

    expect(result.ok).toBe(true);
    expect(task.status).toBe("in_progress");
  });

  it("in_progress -> completed via complete()", () => {
    const task = createTask();
    task.start();
    const result = task.complete();

    expect(result.ok).toBe(true);
    expect(task.status).toBe("completed");
    expect(task.completedAt).toBeInstanceOf(Date);
  });

  it("pending -> completed não é permitido", () => {
    const task = createTask();
    const result = task.complete();

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(InvalidTaskTransitionError);
  });

  it("pending -> cancelled via cancel()", () => {
    const task = createTask();
    const result = task.cancel("Não é mais necessário");

    expect(result.ok).toBe(true);
    expect(task.status).toBe("cancelled");
    expect(task.cancelledAt).toBeInstanceOf(Date);
    expect(task.cancellationReason).toBe("Não é mais necessário");
  });

  it("in_progress -> cancelled via cancel()", () => {
    const task = createTask();
    task.start();
    const result = task.cancel("Bloqueado por dependência");

    expect(result.ok).toBe(true);
    expect(task.status).toBe("cancelled");
  });

  it("cancelamento exige motivo", () => {
    const task = createTask();
    const result = task.cancel("  ");

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
    expect(result.error.message).toContain("motivo");
  });

  it("completed -> pending via reopen()", () => {
    const task = createTask();
    task.start();
    task.complete();
    const result = task.reopen();

    expect(result.ok).toBe(true);
    expect(task.status).toBe("pending");
    expect(task.completedAt).toBeNull();
  });

  it("cancelled -> pending via reopen()", () => {
    const task = createTask();
    task.cancel("Engano");
    const result = task.reopen();

    expect(result.ok).toBe(true);
    expect(task.status).toBe("pending");
    expect(task.cancelledAt).toBeNull();
    expect(task.cancellationReason).toBeNull();
  });

  it("completed -> in_progress não é permitido", () => {
    const task = createTask();
    task.start();
    task.complete();
    const result = task.start();

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(InvalidTaskTransitionError);
  });

  it("cancelled -> in_progress não é permitido", () => {
    const task = createTask();
    task.cancel("Feito");
    const result = task.start();

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(InvalidTaskTransitionError);
  });
});

describe("Mutações", () => {
  it("changeTitle atualiza o título em tarefa ativa", () => {
    const task = createTask();
    const result = task.changeTitle("Novo título");

    expect(result.ok).toBe(true);
    expect(task.title).toBe("Novo título");
  });

  it("changeTitle rejeita título vazio", () => {
    const task = createTask();
    const result = task.changeTitle("");

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
  });

  it("changeTitle rejeita em tarefa concluída", () => {
    const task = createTask();
    task.start();
    task.complete();
    const result = task.changeTitle("Novo título");

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
    expect(result.error.message).toContain("completed");
  });

  it("changeDescription atualiza a descrição", () => {
    const task = createTask();
    const result = task.changeDescription("Descrição atualizada");

    expect(result.ok).toBe(true);
    expect(task.description).toBe("Descrição atualizada");
  });

  it("changeDescription rejeita em tarefa cancelada", () => {
    const task = createTask();
    task.cancel("Cancelada");
    const result = task.changeDescription("Nova desc");

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
  });

  it("changePriority atualiza a prioridade", () => {
    const task = createTask();
    const result = task.changePriority("urgent");

    expect(result.ok).toBe(true);
    expect(task.priority).toBe("urgent");
  });

  it("changeDueDate atualiza a data limite", () => {
    const task = createTask();
    const future = new Date(Date.now() + 86_400_000);
    const result = task.changeDueDate(future);

    expect(result.ok).toBe(true);
    expect(task.dueDate).toEqual(future);
  });

  it("changeDueDate rejeita data no passado", () => {
    const task = createTask();
    const past = new Date(Date.now() - 86_400_000);
    const result = task.changeDueDate(past);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(TaskValidationError);
  });

  it("changeDueDate aceita null para limpar", () => {
    const task = createTask();
    const result = task.changeDueDate(null);

    expect(result.ok).toBe(true);
    expect(task.dueDate).toBeNull();
  });

  it("mutações atualizam updatedAt", () => {
    const task = createTask();
    const before = task.updatedAt;

    task.changeTitle("Alterado");

    expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe("Propriedades computadas", () => {
  it("isActive é true para pending", () => {
    const task = createTask();
    expect(task.isActive).toBe(true);
  });

  it("isActive é true para in_progress", () => {
    const task = createTask();
    task.start();
    expect(task.isActive).toBe(true);
  });

  it("isActive é false para completed", () => {
    const task = createTask();
    task.start();
    task.complete();
    expect(task.isActive).toBe(false);
  });

  it("isActive é false para cancelled", () => {
    const task = createTask();
    task.cancel("Feito");
    expect(task.isActive).toBe(false);
  });

  it("isOverdue é false sem data limite", () => {
    const task = createTask();
    expect(task.isOverdue).toBe(false);
  });

  it("isOverdue é true quando atrasada e ativa", () => {
    const task = new Task({
      id: "1",
      title: "Tarefa atrasada",
      description: null,
      status: "pending",
      priority: "medium",
      dueDate: new Date(Date.now() - 86_400_000),
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(task.isOverdue).toBe(true);
  });

  it("isOverdue é false quando concluída mesmo se atrasada", () => {
    const task = new Task({
      id: "1",
      title: "Tarefa concluída",
      description: null,
      status: "completed",
      priority: "medium",
      dueDate: new Date(Date.now() - 86_400_000),
      completedAt: new Date(),
      cancelledAt: null,
      cancellationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(task.isOverdue).toBe(false);
  });

  it("isOverdue é false quando data limite é no futuro", () => {
    const task = new Task({
      id: "1",
      title: "Tarefa futura",
      description: null,
      status: "pending",
      priority: "medium",
      dueDate: new Date(Date.now() + 86_400_000),
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(task.isOverdue).toBe(false);
  });
});
