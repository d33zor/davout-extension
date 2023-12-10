import ky from 'ky'

import { Cache } from '../cache/cache'
import { CacheFactory } from '../cache/cacheFactory'
import { Logger } from '../logger/logger'
import { LoggerFactory } from '../logger/loggerFactory'
import { UserLolRanking } from './userLolRanking'

interface GetUserLolRankingResponse {
  userRanking: UserLolRanking
}

export class UserLolRankingService {
  private cacheExpirationTime = 1000 * 60 * 60 * 2 // 2 hours

  private readonly usersRankingsCache: Cache<string, UserLolRanking>

  private readonly logger: Logger

  public constructor(loggerFactory: LoggerFactory, cacheFactory: CacheFactory) {
    this.usersRankingsCache = cacheFactory.create<string, UserLolRanking>('usersLolRankings')
    this.logger = loggerFactory.create('UserLolRankingService')
  }

  public async getUserLolRanking(twitchUsername: string): Promise<UserLolRanking> {
    const cachedUserLolRanking = this.usersRankingsCache.get(twitchUsername)

    if (cachedUserLolRanking) {
      return cachedUserLolRanking
    }

    const { userRanking: userLolRanking } = await ky
      .get(`https://api.davout.io/api/users/rankings/${twitchUsername}`)
      .json<GetUserLolRankingResponse>()

    this.logger.debug('UserLolRanking found.', {
      twitchUsername,
      userLolRanking,
    })

    this.usersRankingsCache.set(userLolRanking.twitchUsername, userLolRanking, this.cacheExpirationTime)

    return userLolRanking
  }
}