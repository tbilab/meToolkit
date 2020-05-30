context("test-normalize_phecodes")

test_that("multiplication works", {
  expect_equal(meToolkit:::normalize_phecodes(c(8, 8.1, 9.2)), c('008.00', '008.10', '009.20'))
})
