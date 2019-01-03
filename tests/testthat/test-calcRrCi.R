context("test-calcRrCi")

test_that("Gets expected RR interval", {
  set.seed(42)
  expected_results <- list(
    PE = 1.455625,
    lower = 0.6169498,
    upper = 3.434385
  )
  RR_results <- calcRrCi(
    pattern_n=120, pattern_snp=5,
    other_n=2000, other_snp=56,
    CI_size = 0.95
  )
  expect_equivalent(RR_results, expected_results, tolerance = .002)
})
