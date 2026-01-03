import express from 'express';
import LogsController from '../controllers/logsController';
import { validateRequest } from '../middleware/validateRequest';
import {
    uploadLogValidator,
    uploadBulkLogsValidator,
    queryLogsValidator,
    getLogByIdValidator,
    updateProcessingStatusValidator,
    updateClassificationValidator
} from '../validators/logValidator';

const router = express.Router();
const logsController = new LogsController();

// Upload routes
router.post(
    '/upload',
    validateRequest(uploadLogValidator),
    logsController.uploadLog.bind(logsController)
);

router.post(
    '/upload/bulk',
    validateRequest(uploadBulkLogsValidator),
    logsController.uploadBulkLogs.bind(logsController)
);

// Query routes
router.get(
    '/',
    validateRequest(queryLogsValidator),
    logsController.queryLogs.bind(logsController)
);

router.get(
    '/pending',
    validateRequest(getLogByIdValidator),
    logsController.getPendingLogs.bind(logsController)
);

router.get(
    '/stats',
    validateRequest(getLogByIdValidator),
    logsController.getStatistics.bind(logsController)
);

router.get(
    '/testrun/:testRunId',
    validateRequest(getLogByIdValidator),
    logsController.getLogsByTestRun.bind(logsController)
);

router.get(
    '/:logId',
    validateRequest(getLogByIdValidator),
    logsController.getLog.bind(logsController)
);

// Update routes (for AI agents)
router.put(
    '/:logId/status',
    validateRequest(updateProcessingStatusValidator),
    logsController.updateProcessingStatus.bind(logsController)
);

router.put(
    '/:logId/classification',
    validateRequest(updateClassificationValidator),
    logsController.updateClassification.bind(logsController)
);

// Delete route
router.delete(
    '/:logId',
    validateRequest(getLogByIdValidator),
    logsController.deleteLog.bind(logsController)
);

export default router;