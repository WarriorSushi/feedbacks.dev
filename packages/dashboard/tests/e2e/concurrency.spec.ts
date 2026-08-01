import { expect, test, skipE2EIfNeeded } from "./fixtures";
import { signInWithTestSession } from "./helpers/auth";
import { createProjectViaApi } from "./helpers/project";

const env = skipE2EIfNeeded();
test.skip(!env.ready, env.skipReason);

test("stale project settings writes are rejected instead of silently overwriting", async ({
  page,
}) => {
  await signInWithTestSession(page);
  const project = await createProjectViaApi(page);

  const firstRead = await page.request.get(`/api/projects/${project.id}`);
  expect(firstRead.ok()).toBe(true);
  const initialVersion = firstRead.headers().etag;
  expect(initialVersion).toBeTruthy();

  const accepted = await page.request.patch(`/api/projects/${project.id}`, {
    headers: { "X-Feedbacks-Version": initialVersion.replaceAll('"', '') },
    data: { name: `${project.name} accepted` },
  });
  expect(accepted.ok()).toBe(true);
  expect(accepted.headers().etag).not.toBe(initialVersion);

  const stale = await page.request.patch(`/api/projects/${project.id}`, {
    headers: { "X-Feedbacks-Version": initialVersion.replaceAll('"', '') },
    data: { name: `${project.name} stale` },
  });
  expect(stale.status()).toBe(409);
  await expect(stale.json()).resolves.toMatchObject({
    error: { code: "EDIT_CONFLICT" },
  });

  const finalRead = await page.request.get(`/api/projects/${project.id}`);
  await expect(finalRead.json()).resolves.toMatchObject({
    name: `${project.name} accepted`,
  });
});

test("stale inbox triage writes preserve the first accepted change", async ({
  page,
}) => {
  await signInWithTestSession(page);
  const project = await createProjectViaApi(page);
  const created = await page.request.post("/api/v1/feedback", {
    headers: {
      "X-API-Key": project.apiKey,
      "Idempotency-Key": `playwright-${crypto.randomUUID()}`,
    },
    data: { message: "Concurrent triage check", type: "bug" },
  });
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  const list = await page.request.get("/api/v1/feedback?limit=10", {
    headers: { "X-API-Key": project.apiKey },
  });
  const listed = (await list.json()).data.find(
    (feedback: { id: string }) => feedback.id === id,
  );
  expect(listed?.updated_at).toBeTruthy();
  const initialVersion = `"${listed.updated_at}"`;

  const accepted = await page.request.patch(`/api/feedback/${id}`, {
    headers: { "X-Feedbacks-Version": initialVersion.replaceAll('"', '') },
    data: { status: "reviewed" },
  });
  expect(accepted.ok()).toBe(true);

  const stale = await page.request.patch(`/api/feedback/${id}`, {
    headers: { "X-Feedbacks-Version": initialVersion.replaceAll('"', '') },
    data: { priority: "critical" },
  });
  expect(stale.status()).toBe(409);
  await expect(stale.json()).resolves.toMatchObject({
    error: { code: "EDIT_CONFLICT" },
  });
});
