const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.get('/overview', analyticsController.getOverview);
router.get('/filters', analyticsController.getFilters);
router.get('/trends/quarters', analyticsController.getQuarterTrends);
router.get('/trends/months', analyticsController.getMonthTrends);
router.get('/positions', analyticsController.getPositions);
router.get('/positions/:position/skills', analyticsController.getPositionSkills);
router.get('/skills/top', analyticsController.getTopSkills);
router.get('/languages/top', analyticsController.getTopLanguages);
router.get('/skills/co-occurrence', analyticsController.getSkillCoOccurrence);
router.get('/salaries/by-position', analyticsController.getSalaryByPosition);
router.get('/salaries/by-experience', analyticsController.getSalaryByExperience);
router.get('/salaries/by-city', analyticsController.getSalaryByCity);
router.get('/salaries/by-skill', analyticsController.getSalaryBySkill);
router.get('/locations', analyticsController.getLocations);
router.get('/locations/wards', analyticsController.getWards);
router.get('/markets/cities', analyticsController.getCityMarkets);
router.get('/companies/top', analyticsController.getTopCompanies);
router.get('/companies/by-field', analyticsController.getCompaniesByField);
router.get('/levels', analyticsController.getLevels);
router.get('/levels/:level/skills', analyticsController.getLevelSkills);
router.get('/experience/by-position', analyticsController.getExperienceByPosition);
router.get('/jobs/summary', analyticsController.getJobsSummary);
router.get('/jobs/breakdown', analyticsController.getJobsBreakdown);

module.exports = router;
