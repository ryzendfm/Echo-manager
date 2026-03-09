const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadReceipt } = require('../config/uploadConfig');
const {
    getPhases,
    savePhases,
    recordPayment,
    updatePayment,
    resetPhasePayments,
    updatePhase,
    deletePhase,
    getProjectFinancials,
    getAllFinancials,
} = require('../controllers/projectPhaseController');

router.get('/all-financials', auth, getAllFinancials);
router.get('/project/:projectId', auth, getPhases);
router.post('/project/:projectId', auth, savePhases);
router.put('/:phaseId', auth, uploadReceipt.single('receipt'), updatePhase);
router.delete('/:phaseId', auth, deletePhase);
router.post('/:phaseId/payments', auth, uploadReceipt.single('receipt'), recordPayment);
router.put('/:phaseId/payments/:paymentId', auth, uploadReceipt.single('receipt'), updatePayment);
router.delete('/:phaseId/payments', auth, resetPhasePayments);
router.get('/project/:projectId/financials', auth, getProjectFinancials);

module.exports = router;
