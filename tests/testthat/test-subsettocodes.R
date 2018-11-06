library(tibble)
context("test-subsettocodes")


sample_phenotypes <- as_tibble(matrix(c(
  0, 1, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 1, 1, 0,
  0, 1, 1, 0, 1,
  1, 1, 0, 0, 1,
  0, 0, 0, 0, 1,
  0, 1, 0, 0, 0,
  0, 0, 0, 0, 1,
  0, 1, 1, 1, 0 ), ncol = 5, byrow = TRUE ) )

colnames(sample_phenotypes) <- c('001.00', '002.00', '003.00', '004.00', '005.00')
sample_phenotypes['IID'] <- letters[1:10]
sample_phenotypes['snp'] <- rbinom(n = 10, prob = 0.5, size = 2)




test_that("subsetting", {

  simple_subset <- subsetToCodes(sample_phenotypes, c('001.00', '002.00'))

  expect_equal(ncol(simple_subset), 4)

  expect_equal(nrow(simple_subset), 6)

  expect_setequal(c('a', 'b', 'e', 'f', 'h', 'j'), simple_subset$IID)
})
