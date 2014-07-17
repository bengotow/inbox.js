describe('stringFormat', function() {
  it('should replace `%@` with Object.toString()-ified parameter', function() {
    expect(stringFormat('%@/%@/%@', 'foo', 123, null)).toBe('foo/123/null');
  });


  it('should replace `%@` markers with the empty string when no parameters remain', function() {
    expect(stringFormat('%@.%@jpeg', 'test')).toBe('test.jpeg');
  });
});
