import { FastifyInstance } from 'fastify';
import { OrderQueue } from '../services/queue';
import { Queue } from 'bullmq';

export async function dlqRoutes(fastify: FastifyInstance) {
  const orderQueue = new OrderQueue();

  // Get all failed orders from BullMQ failed jobs
  fastify.get('/api/dlq/failed-orders', async (request, reply) => {
    try {
      const marketQueue = orderQueue.getMarketQueue();
      const dlqQueue = orderQueue.getDeadLetterQueue();
      
      // Get failed jobs from market queue
      const failedJobs = await marketQueue.getFailed(0, 50);
      
      // Get processed DLQ jobs
      const dlqJobs = await dlqQueue.getCompleted(0, 50);
      
      const failedOrders = failedJobs.map(job => ({
        orderId: job.data.id,
        originalOrder: job.data,
        failureReason: job.failedReason || 'Unknown error',
        attemptsMade: job.attemptsMade,
        failedAt: new Date(job.processedOn || job.timestamp).toISOString(),
        lastError: job.stacktrace?.[0] || job.failedReason
      }));
      
      const dlqProcessedOrders = dlqJobs.map(job => ({
        orderId: job.data.originalJob.id,
        originalOrder: job.data.originalJob,
        failureReason: job.data.failureReason,
        attemptsMade: job.data.attempts,
        failedAt: job.data.failedAt,
        lastError: job.data.lastError,
        dlqProcessedAt: new Date(job.processedOn || job.timestamp).toISOString()
      }));
      
      return reply.send({
        count: failedOrders.length + dlqProcessedOrders.length,
        failedJobs: failedOrders,
        dlqProcessedJobs: dlqProcessedOrders,
        message: `Found ${failedOrders.length} failed jobs and ${dlqProcessedOrders.length} DLQ processed jobs`
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to fetch failed orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get DLQ statistics
  fastify.get('/api/dlq/stats', async (request, reply) => {
    try {
      const marketQueue = orderQueue.getMarketQueue();
      const dlqQueue = orderQueue.getDeadLetterQueue();
      
      const [marketCounts, dlqCounts] = await Promise.all([
        marketQueue.getJobCounts('failed', 'completed', 'active', 'waiting'),
        dlqQueue.getJobCounts('completed', 'active', 'waiting')
      ]);
      
      return reply.send({
        marketQueue: marketCounts,
        dlqQueue: dlqCounts,
        totalFailed: marketCounts.failed + dlqCounts.completed
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to fetch DLQ stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Clear all failed orders from DLQ
  fastify.delete('/api/dlq/clear', async (request, reply) => {
    try {
      const marketQueue = orderQueue.getMarketQueue();
      const dlqQueue = orderQueue.getDeadLetterQueue();
      
      // Clean failed jobs from market queue
      await marketQueue.clean(0, 1000, 'failed');
      
      // Clean completed jobs from DLQ
      await dlqQueue.clean(0, 1000, 'completed');
      
      // Also clean any active/waiting jobs in DLQ
      await dlqQueue.clean(0, 1000, 'active');
      await dlqQueue.clean(0, 1000, 'waiting');
      
      return reply.send({
        message: 'DLQ cleared successfully',
        cleared: 'All failed orders and DLQ jobs removed'
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to clear DLQ',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Clear only failed jobs (keep DLQ processed jobs)
  fastify.delete('/api/dlq/clear/failed', async (request, reply) => {
    try {
      const marketQueue = orderQueue.getMarketQueue();
      
      // Clean only failed jobs from market queue
      const cleaned = await marketQueue.clean(0, 1000, 'failed');
      
      return reply.send({
        message: 'Failed jobs cleared successfully',
        clearedCount: cleaned.length
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to clear failed jobs',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}