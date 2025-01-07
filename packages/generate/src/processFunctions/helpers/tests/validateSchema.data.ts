export const VALID_SCHEMA: string = `
type Test @model { 
  id: ID
  enumField: TestEnum 
} 

enum TestEnum { 
  A
  B
  C
}
` as const;

export const INVALID_SCHEMA: string = `
type Test @model { 
  id: ID
  enumField: TestEnum 
}
` as const;
