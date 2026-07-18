export type MockResponseOptions = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  contentType?: string | null;
};

export const buildMockResponse = (
  body: unknown,
  {
    ok = true,
    status = 200,
    statusText = 'OK',
    contentType = 'application/json',
  }: MockResponseOptions = {},
): Response => {
  return {
    ok,
    status,
    statusText,
    headers: { get: () => contentType },
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
};
