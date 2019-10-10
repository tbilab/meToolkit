context('Extracting SNPs and Codes from URL strings')

normal_query <- "?rs123456__00800_90800_08300"
no_snp <-  "?00800_90800_08300"
no_codes <- "?rs123456__"
empty_query <- ""

test_that("Basic snp extraction works", {
  extracted <- extract_snp_codes_from_url(normal_query)
  expect_equal(extracted$snp, 'rs123456')
})

test_that("snp extraction without codes works", {
  extracted <- extract_snp_codes_from_url(no_codes)
  expect_equal(extracted$snp, 'rs123456')
})

test_that("Basic code extraction works", {
  extracted <- extract_snp_codes_from_url(normal_query)
  expect_equal(extracted$codes, c("008.00", "908.00", "083.00"))
})

test_that("Query with only one code gets ignored", {
  extracted <- extract_snp_codes_from_url("?rs123456__00800")
  expect_equal(extracted$cdes, NULL)
})

test_that("Code extraction without snp works", {
  extracted <- extract_snp_codes_from_url(no_snp)
  expect_equal(extracted$codes, c("008.00", "908.00", "083.00"))
})

test_that("Missing SNP filled with NULL", {
  extracted <- extract_snp_codes_from_url(no_snp)
  expect_equal(extracted$snp, NULL)
})

test_that("Missing SNP filled with NULL when no query", {
  extracted <- extract_snp_codes_from_url(empty_query)
  expect_equal(extracted$snp, NULL)
})

test_that("Missing Codes filled with NULL when no query", {
  extracted <- extract_snp_codes_from_url(empty_query)
  expect_equal(extracted$snp, NULL)
})
