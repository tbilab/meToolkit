context("test-simphewasresults")

test_that("Gives correct number of rows", {
  expect_equal(nrow(meToolkit::simPhewasResults(n_codes = 100, n_categories = 11)), 100)
  expect_equal(nrow(meToolkit::simPhewasResults(n_codes = 10, n_categories = 3)), 10)
})

test_that("Throws error when attempting to have more categories than codes", {
  expect_error(meToolkit::simPhewasResults(n_codes = 10, n_categories = 11))
})

test_that("Throws error when attempting to have too many categories", {
  expect_error(meToolkit::simPhewasResults(n_codes = 100, n_categories = 30))
})

test_that("P-Values are in proper ranges", {
  big_sim <- meToolkit::simPhewasResults(n_codes = 1000, n_categories = 12)

  expect_true(max(big_sim$p_val) < 1)
  expect_true(min(big_sim$p_val) > 0)
})
