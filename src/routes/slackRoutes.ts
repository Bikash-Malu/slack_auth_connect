import { Router } from 'express';
import { 
  initiateOAuth, 
  handleOAuthCallback, 
  getChannels, 
  sendMessageController, 
  getScheduled, 
  cancelScheduled, 
  logoutController
} from '../controllers/slackController';

const router = Router();

router.get('/auth', initiateOAuth);
router.get('/callback', handleOAuthCallback);
router.get('/channels', getChannels);
router.post('/message', sendMessageController);
router.get('/scheduled', getScheduled);
router.delete('/scheduled/:id', cancelScheduled);
router.post('/logout', logoutController);
export default router;
