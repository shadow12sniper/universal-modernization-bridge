import { logBus } from "@/lib/log-bus";

export const dynamic = "force-dynamic"; // disable static caching

export async function GET(): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Push an initial message so the client knows the connection is alive
      controller.enqueue(encoder.encode("data: {\"connected\":true}\n\n"));

      const unsubscribe = logBus.subscribe((entry: string) => {
        const data = `data: ${entry}\n\n`;
        controller.enqueue(encoder.encode(data));
      });

      // Heartbeat every 15s to keep the connection alive
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      // Cleanup when the stream is cancelled (client disconnects).
      // The `start` method can return a cleanup function.
      return () => {
        unsubscribe();
        clearInterval(interval);
        try { controller.close(); } catch {}
      };
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}