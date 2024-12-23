/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloneDeep } from 'lodash';
import type { FilterConverterMongoDBParams } from '../FilterConverterMongoDB';

const defaultContext = {
  autographcraft: {
    logger: undefined,
    authorisationInstance: undefined as any,
  },
};

const defaultParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: undefined,
};

export function getDefaultParams() {
  return cloneDeep(defaultParams);
}

const equalOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      eq: '2024-01-01T00:00:00.000Z',
    },
  },
};

export function getEqualOnlyParams() {
  return cloneDeep(equalOnlyParams);
}

const notEqualOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      ne: '2024-01-01T00:00:00.000Z',
    },
  },
};

export function getNotEqualOnlyParams() {
  return cloneDeep(notEqualOnlyParams);
}

const lessThanOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      lt: '2024-01-01T00:00:00.000Z',
    },
  },
};

export function getLessThanOnlyParams() {
  return cloneDeep(lessThanOnlyParams);
}

const lessThanOrEqualOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      le: '2024-01-01T00:00:00.000Z',
    },
  },
};

export function getLessThanOrEqualOnlyParams() {
  return cloneDeep(lessThanOrEqualOnlyParams);
}

const greaterThanOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      gt: '2024-01-01T00:00:00.000Z',
    },
  },
};

export function getGreaterThanOnlyParams() {
  return cloneDeep(greaterThanOnlyParams);
}

const greaterThanOrEqualOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      ge: '2024-01-01T00:00:00.000Z',
    },
  },
};

export function getGreaterThanOrEqualOnlyParams() {
  return cloneDeep(greaterThanOrEqualOnlyParams);
}

const inOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      in: ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'],
    },
  },
};

export function getInOnlyParams() {
  return cloneDeep(inOnlyParams);
}

const notInOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      notIn: ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'],
    },
  },
};

export function getNotInOnlyParams() {
  return cloneDeep(notInOnlyParams);
}

const betweenOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      between: ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'],
    },
  },
};

export function getBetweenOnlyParams() {
  return cloneDeep(betweenOnlyParams);
}

const startsWithOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    name: {
      startsWith: 'test',
    },
  },
};

export function getStartsWithOnlyParams() {
  return cloneDeep(startsWithOnlyParams);
}

const existsOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    name: {
      exists: true,
    },
  },
};

export function getExistsOnlyParams() {
  return cloneDeep(existsOnlyParams);
}

const combinationFilter: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    startDate: {
      eq: '2024-01-01T00:00:00.000Z',
      lt: '2024-01-02T00:00:00.000Z',
    },
    name: {
      startsWith: 'test',
      exists: true,
    },
  },
};

export function getCombinationFilter() {
  return cloneDeep(combinationFilter);
}

const andOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    and: [
      {
        startDate: {
          eq: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          gt: '2024-01-01T00:00:00.000Z',
        },
      },
      {
        endDate: {
          lt: '2024-01-02T00:00:00.000Z',
        },
      },
    ],
  },
};

export function getAndOnlyParams() {
  return cloneDeep(andOnlyParams);
}

const nestedAndOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    and: [
      {
        and: [
          {
            startDate: {
              eq: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            endDate: {
              gt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
      {
        status: {
          eq: 'active',
        },
      },
    ],
  },
};

export function getNestedAndOnlyParams() {
  return cloneDeep(nestedAndOnlyParams);
}

const orOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    or: [
      {
        startDate: {
          eq: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          gt: '2024-01-01T00:00:00.000Z',
        },
      },
      {
        endDate: {
          lt: '2024-01-02T00:00:00.000Z',
        },
      },
    ],
  },
};

export function getOrOnlyParams() {
  return cloneDeep(orOnlyParams);
}

const notOnlyParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    not: {
      startDate: {
        eq: '2024-01-01T00:00:00.000Z',
      },
      endDate: {
        gt: '2024-01-01T00:00:00.000Z',
      },
    },
  },
};

export function getNotOnlyParams() {
  return cloneDeep(notOnlyParams);
}

const filterWithIdParams: FilterConverterMongoDBParams = {
  context: defaultContext,
  filter: {
    id: {
      eq: '12345',
    },
  },
};

export function getFilterWithIdParams() {
  return cloneDeep(filterWithIdParams);
}
