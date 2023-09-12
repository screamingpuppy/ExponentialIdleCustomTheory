import { ExponentialCost, FreeCost, LinearCost } from "./api/Costs"
import { BigNumber } from "./api/BigNumber"
import { theory, QuaternaryEntry } from "./api/Theory"
import { Utils } from "./api/Utils"
import { UI } from "./api/ui/UI"
import { Localization } from "./api/Localization"

const TextResource = {
    "Achievements": {
        "Progress": {
            "Name": {
                "en": "Progress",
                "zh-Hant": "進度",
                "zh-Hans": "进度"
            },
            "e10": {
                "Name": {
                    "en": "Beginner",
                    "zh-Hant": "初階",
                    "zh-Hans": "初阶"
                },
                "Description": {
                    "en": "Reach e10ρ",
                    "zh-Hant": "達到e10ρ",
                    "zh-Hans": "达到e10ρ"
                }
            },
            "e25": {
                "Name": {
                    "en": "Novice",
                    "zh-Hant": "新手",
                    "zh-Hans": "新手"
                },
                "Description": {
                    "en": "Reach e25ρ",
                    "zh-Hant": "達到e25ρ",
                    "zh-Hans": "达到e25ρ"
                }
            },
            "e50": {
                "Name": {
                    "en": "Learner",
                    "zh-Hant": "學者",
                    "zh-Hans": "学者"
                },
                "Description": {
                    "en": "Reach e50ρ",
                    "zh-Hant": "達到e50ρ",
                    "zh-Hans": "达到e50ρ"
                }
            }
        },
        "Secret": {
            "Name": {
                "en": "Secret",
                "zh-Hant": "秘密",
                "zh-Hans": "秘密"
            },
            "Luck": {
                "Name": {
                    "en": "Luck",
                    "zh-Hant": "幸運",
                    "zh-Hans": "幸运"
                },
                "Description": {
                    "en": "You have a 1 in 1 million chance of getting this achievement per tick",
                    "zh-Hant": "在每一刻有一百萬分之一的機會獲得此成就",
                    "zh-Hans": "在每一刻有一百万分之一的机会获得此成就"
                },
                "Hint": {
                    "en": "Hope you're lucky",
                    "zh-Hant": "祝你好運",
                    "zh-Hans": "祝你好运",
                    "fi": "Onnea"
                }
            }
        }
    },
    "PublicationMultiplier": {
        "en": "Publication Multiplier",
        "zh-Hant": "出版物倍率",
        "zh-Hans": "出版物倍率",
        "fi": "Julkaisukerroin"
    },
    "TestUpgrade": {
        "en": "Free e5",
        "zh-Hant": "免費e5",
        "zh-Hans": "免费e5",
        "fi": "Ihmainen e5"
    },
    "Hour": {
        "en": "hour",
        "zh-Hant": "小時",
        "zh-Hans": "小时",
        "fi": "tunti",
        "de": "stunde"
    }
}

var id = "ExponentialPowerTest"
var getName = language => {
    const names = {
        "en": "Exponential Power (Test)",
        "zh-Hant": "指數力量 (測試)",
        "zh-Hans": "指数力量 (测试)",
        "fi": "Eksponentiaalinen Teho (Testi)"
    }
    return names[language] ?? names.en
}
var getDescription = language => {
    const descriptions = {
        "en": [
            "Exponential Power by HyperKNF",
            "",
            "Chinese Traditional, Chinese Simplified and Finnish are translated by HyperKNF"
        ],
        "zh-Hant": [
            "指數力量由HyperKNF設計",
            "",
            "繁體中文，簡體中文和芬蘭語由HyperKNF翻譯"
        ],
        "zh-Hans": [
            "指数力量由HyperKNF设计",
            "",
            "简体中文，简体中文和芬兰语由HyperKNF翻译"
        ],
        "fi": [
            "HyperKNF:stä Eksponentiaalinen Teho",
            "",
            "Perinteinen kiina, yksinkertaistettu kiina ja suomeksi kääntänyt HyperKNF"
        ]
    }
    return (descriptions[language] ?? descriptions.en).join("\n")
}
var authors = "HyperKNF"
var version = "v1.2.test"

var drho = BigNumber.ZERO
var tph = BigNumber.ZERO

var currency
var k, c1, c2, n, a, b, x, y, x1, x2, dtime
var unlock
var publication, tickrate, unlockE

var dt = BigNumber.ONE / 10

var achievements = {
    regular: [
        false,
        false,
        false
    ],
    secret: [
        false
    ]
}

var regular_achievements, secret_achievements
var achievement1, achievement2
var secret_achievement1
var chapter1, chapter2

var page = 1
var E = BigNumber.E
var E1 = BigNumber.ZERO, E2 = BigNumber.ZERO, E3 = BigNumber.ZERO, E4 = BigNumber.ZERO
var EDisplay = [BigNumber.ZERO, BigNumber.ZERO, BigNumber.ZERO, BigNumber.ZERO]
var time = BigNumber.ZERO

var secret_achievement_chance = 1e6

var tertiary_display = Array.from({
    length: 2
}, () => BigNumber.from(0))

var log = (base, value) => BigNumber.from(value).log() / BigNumber.from(base).log()
var getTextResource = resource => resource[Localization.language] ?? resource.en

var getStepwisePowerProduct = (level, base, step_length, offset) => {
    if (offset != 0) throw new Error("I don't know how to implement non-zero offset :)")
    
    const step = Math.floor(level / step_length)
    const levels = level % step_length
    const exponents = Array.from({
        length: step
    }, () => step_length)
    exponents.push(levels)
    const product = exponents.reduce(
        (product, value, index) => {
            return product * BigNumber.from(base).pow(index + 1).pow(value)
        }, 1
    )
    return product
}

var init = () => {
    currency = theory.createCurrency()

    ///////////////////
    // Regular Upgrades

    // k
    {
        let getDesc = (level) => "k=" + getK(level).toString(0)
        k = theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(10, Math.log2(1.5))))
        k.getDescription = (_) => Utils.getMath(getDesc(k.level))
        k.getInfo = (amount) => Utils.getMathTo(getDesc(k.level), getDesc(k.level + amount))
    }

    // c1
    {
        let getDesc = (level) => "c_1=" + getC1(level).toString(1)
        c1 = theory.createUpgrade(1, currency, new CustomCost(
            level => 15 * getStepwisePowerProduct(level, 2, 50, 0)
        ))
        c1.getDescription = (_) => Utils.getMath(getDesc(c1.level))
        c1.getInfo = (amount) => Utils.getMathTo(getDesc(c1.level), getDesc(c1.level + amount))
    }

    // c2
    {
        let getDesc = (level) => "c_2=" + getC2(level).toString(5)
        let getInfo = (level) => "c_2=" + getC2(level).toString(5)
        c2 = theory.createUpgrade(2, currency, new ExponentialCost(50, Math.log2(10)))
        c2.getDescription = (_) => Utils.getMath(getDesc(c2.level))
        c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount))
    }

    // x1
    {
        let getDesc = level => "x_1=" + getX1(level).toString(2)
        x1 = theory.createUpgrade(3, currency, new ExponentialCost(1e40, Math.log2(75)))
        x1.getDescription = _ => Utils.getMath(getDesc(x1.level))
        x1.getInfo = amount => Utils.getMathTo(getDesc(x1.level), getDesc(x1.level + amount))
    }
    
    // x2
    {
        let getInfo = level => "x_2=" + getX2(level).toString(3)
        let getDesc = level => "x_2=e^{" + getX2Exponent(level) + "}"
        x2 = theory.createUpgrade(4, currency, new ExponentialCost(1e60, Math.log2(10 ** 2.5)))
        x2.getDescription = _ => Utils.getMath(getDesc(x2.level))
        x2.getInfo = amount => Utils.getMathTo(getInfo(x2.level), getInfo(x2.level + amount))
    }

    // n
    {
        let getDesc = (level) => "n=" + getN(level).toString(0)
        n = theory.createUpgrade(100, currency, new ExponentialCost(1e20, Math.log2(1.75)))
        n.getDescription = (_) => Utils.getMath(getDesc(n.level))
        n.getInfo = (amount) => Utils.getMathTo(getDesc(n.level), getDesc(n.level + amount))
    }

    // a
    {
        let getInfo = (level) => "a=" + getInverseEDisplay(getInverseA(level))
        let getDesc = level => "a=e^{" + (BigNumber.from(-0.05) * level).toString(2) + "}"
        a = theory.createUpgrade(101, currency, new ExponentialCost(1e30, Math.log2(2.375)))
        a.getDescription = (_) => Utils.getMath(getDesc(a.level))
        a.getInfo = (amount) => Utils.getMathTo(getInfo(a.level), getInfo(a.level + amount))
    }

    // b
    {
        let getDesc = (level) => "b=" + getB(level).toString(0)
        b = theory.createUpgrade(102, currency, new ExponentialCost(1e30, Math.log2(2.925)))
        b.getDescription = (_) => Utils.getMath(getDesc(b.level))
        b.getInfo = (amount) => Utils.getMathTo(getDesc(b.level), getDesc(b.level + amount))
    }

    // x
    {
        let getDesc = (level) => "x=" + getX(level).toString(0)
        x = theory.createUpgrade(103, currency, new ExponentialCost(1e40, Math.log2(1.925)))
        x.getDescription = (_) => Utils.getMath(getDesc(x.level))
        x.getInfo = (amount) => Utils.getMathTo(getDesc(x.level), getDesc(x.level + amount))
    }

    // y
    {
        let getDesc = (level) => "y=" + getY(level).toString(10)
        let getInfo = (level) => "y=1+H_{" + level + "}"
        y = theory.createUpgrade(104, currency, new ExponentialCost(1e50, Math.log2(2)))
        y.getDescription = (_) => Utils.getMath(getDesc(y.level))
        y.getInfo = (amount) => Utils.getMathTo(getInfo(y.level), getInfo(y.level + amount))
    }

    // dt
    {
        let getDesc = (level) => "\\dot{t}=" + getDT(level).toString(1)
        dtime = theory.createUpgrade(999, currency, new FirstFreeCost(new ExponentialCost(1e5, Math.log2(1e5))))
        dtime.getDescription = (_) => Utils.getMath(getDesc(dtime.level))
        dtime.getInfo = (amount) => Utils.getMathTo(getDesc(dtime.level), getDesc(dtime.level + amount))
        dtime.maxLevel = 10
    }

    /////////////////////
    // Permanent Upgrades
    publication = theory.createPublicationUpgrade(0, currency, 1e10)
    theory.createBuyAllUpgrade(1, currency, 1e13)
    theory.createAutoBuyerUpgrade(2, currency, 1e30)

    {
        let getDesc = level => Localization.getUpgradeMultCustomDesc(getTextResource(TextResource.TickRate), 1.2)
        let getInfo = level => Localization.getUpgradeMultCustomInfo(getTextResource(TextResource.TickRate), 1.2)
        tickrate = theory.createPermanentUpgrade(100, currency, new ExponentialCost(1e60, Math.log2(1e30)))
        tickrate.getDescription = _ => Utils.getMath(getDesc(unlockE.level))
        tickrate.getInfo = _ => Utils.getMath(getInfo(unlockE.level))
    }

    {
        let getDesc = level => `\\text{Unlock }e_{${level + 1}}`
        let getInfo = level => `\\text{Unlocks }e_{${level + 1}}`
        unlockE = theory.createPermanentUpgrade(200, currency, new CustomCost(
            level => {
                switch (level) {
                    case 0:
                        return BigNumber.ZERO
                    case 1:
                        return BigNumber.from(5e30)
                    case 2:
                        return BigNumber.from(5e40)
                    case 3:
                        return BigNumber.from(5e50)
                    case 4:
                        return BigNumber.from(5e60)
                    default:
                        return BigNumber.from("5e69420")
                }
            }
        ))
        unlockE.getDescription = _ => Utils.getMath(getDesc(unlockE.level))
        unlockE.getInfo = _ => Utils.getMath(getInfo(unlockE.level))
        unlockE.maxLevel = 3
    }

    //////////////////
    //// Test Upgrades

    {
        const test_upgrade = theory.createSingularUpgrade(0, currency, new FreeCost())
        test_upgrade.getDescription = test_upgrade.getInfo = _ => Utils.getMath(`\\text{${getTextResource(TextResource.TestUpgrade)}}`)
        test_upgrade.bought = _ => currency.value *= 1e5
    }

    ///////////////////////
    //// Milestone Upgrades
    theory.setMilestoneCost(new LinearCost(20, 20))

    { 
        unlock = theory.createMilestoneUpgrade(0, 3)
        unlock.description = "$\\text{Unlock }E$" 
        unlock.info = "$\\text{Unlocks }E$"
    }
    
    /////////////////
    //// Achievements
    progress_achievements = theory.createAchievementCategory(
        0,
        getTextResource(TextResource.Achievements.Progress.Name)
    )
    secret_achievements = theory.createAchievementCategory(
        999,
        getTextResource(TextResource.Achievements.Secret.Name)
    )
    
    achievement1 = theory.createAchievement(
        0,
        progress_achievements,
        getTextResource(TextResource.Achievements.Progress.e10.Name),
        getTextResource(TextResource.Achievements.Progress.e10.Description),
        () => achievements.regular[0]
    )
    achievement2 = theory.createAchievement(
        1,
        progress_achievements,
        getTextResource(TextResource.Achievements.Progress.e25.Name),
        getTextResource(TextResource.Achievements.Progress.e25.Description),
        () => achievements.regular[1]
    )
    achievement3 = theory.createAchievement(
        2,
        progress_achievements,
        getTextResource(TextResource.Achievements.Progress.e50.Name),
        getTextResource(TextResource.Achievements.Progress.e50.Description),
        () => achievements.regular[2]
    )

    secret_achievement1 = theory.createSecretAchievement(
        99900,
        secret_achievements,
        getTextResource(TextResource.Achievements.Secret.Luck.Name),
        getTextResource(TextResource.Achievements.Secret.Luck.Description),
        getTextResource(TextResource.Achievements.Secret.Luck.Hint),
        () => achievements.secret[0]
    )
    
    ///////////////////
    //// Story chapters
    chapter1 = theory.createStoryChapter(0, "My First Chapter", "This is line 1,\nand this is line 2.\n\nNice.", () => c1.level > 0)
    chapter2 = theory.createStoryChapter(1, "My Second Chapter", "This is line 1 again,\nand this is line 2... again.\n\nNice again.", () => c2.level > 0)
}

var updatePage = () => {
    if (unlock.level < 1 && page == 2) page = 1
}

var updateMilestoneUpgradeInfo = () => {
    unlock.description = Localization.getUpgradeUnlockDesc(
        unlock.level == 0 ? "E" :
        unlock.level == 1 ? "x_1" :
        "x_2"
    )
    unlock.info = Localization.getUpgradeUnlockInfo(
        unlock.level == 0 ? "E" :
        unlock.level == 1 ? "x_1" :
        "x_2"
    )
}

var updateAvailability = () => {
    n.isAvailable = unlock.level >= 1 && unlockE.level >= 1
    a.isAvailable = b.isAvailable = unlock.level >= 1 && unlockE.level >= 2
    x.isAvailable = unlock.level >= 1 && unlockE.level >= 3
    x1.isAvailable = unlock.level >= 2
    x2.isAvailable = unlock.level >= 3

    unlockE.isAvailable = unlock.level >= 1
}

var tick = (elapsedTime, multiplier) => {
    dt = BigNumber.from(elapsedTime * multiplier * getTickRate(tickrate.level))
    let bonus = theory.publicationMultiplier

    E1 = EDisplay[0] = getE1(getN(n.level))
    E2 = EDisplay[1] = getE2(getA(a.level), getB(b.level))
    E3 = EDisplay[2] = getE3(getX(x.level))
    E4 = EDisplay[3] = getE4(getY(y.level))
    E = E1
    if (unlockE.level >= 2) E *= E2
    if (unlockE.level >= 3) E *= E3
    if (unlockE.level >= 4) E *= 4

    time += dt * getDT(dtime.level)
    drho = dt * getK(k.level) * bonus * time.pow(0.6) * (
        unlock.level >= 1 && unlockE.level >= 1 ? E.pow(0.9) : 1
    ) * (tertiary_display[0] = getC1(c1.level).pow(getC2Balance(getC2(c2.level)) * (
        unlock.level >= 2 ? getX1(x1.level) : 1
    ))) * (
        unlock.level >= 3 ? getX2(x2.level) : 1
    )
    tph = (log(10, 1 + currency.value + 36000 * drho) - log(10, 1 + currency.value))
    currency.value += drho

    if (currency.value >= BigNumber.TEN.pow(10)) achievements.regular[0] = true
    if (currency.value >= BigNumber.TEN.pow(25)) achievements.regular[1] = true
    if (currency.value >= BigNumber.TEN.pow(50)) achievements.regular[2] = true

    if (Math.round(Math.random() * (secret_achievement_chance - 1) + 1) == 1) achievements.secret[0] = true

    theory.invalidatePrimaryEquation()
    theory.invalidateSecondaryEquation()
    theory.invalidateTertiaryEquation()
    theory.invalidateQuaternaryValues()

    updatePage()
    updateMilestoneUpgradeInfo()
    updateAvailability()
}

var postPublish = () => time = BigNumber.ZERO

var formatQuaternaryEntry = (...args) => new QuaternaryEntry(...args)

var getPrimaryEquation = () => {
    let result
    if (page == 1) {
        theory.primaryEquationHeight = 55
        result = `\\dot{\\rho}=k${publication.level >= 1 ? "m" : ""}t^{0.6}${unlock.level >= 1 ? "E^{-0.9}" : ""}c_1^{B(c_2)${unlock.level >= 2 ? "x_1" : ""}}${unlock.level >= 3 ? "x_2" : ""}\\\\` + theory.latexSymbol + "=\\max\\rho"
    } else if (page == 2) {
        theory.primaryEquationHeight = 40
        result = `E=\\prod_{i}{e_i}`
    } else result = "\\text{Invalid Page}"
    return "\\begin{array}{c}" + result + "\\end{array}"
}
var getSecondaryEquation = () => {
    let result
    if (page == 1) {
        theory.secondaryEquationHeight = publication.level >= 1 ? 57 : 37
        result = `B(x)=\\frac{x}{\\sqrt{\\log_{e20}{\\max{(1+\\rho, e20)}}}}${publication.level >= 1 ? `\\\\m=\\text{${getTextResource(TextResource.PublicationMultiplier)}}` : ""}`
    } else if (page == 2) {
        theory.secondaryEquationHeight = 37 * unlockE.level
        result = "e_1=e-(1+\\frac{1}{n})^n"
        if (unlockE.level >= 2) result += "\\\\e_2=e-(1+\\frac{a}{b})^{\\frac{b}{a}}"
        if (unlockE.level >= 3) result += "\\\\e_3=e-(\\frac{x}{x+1})^{-x}"
        if (unlockE.level >= 4) result += "\\\\e_4=e-\\frac{y!}{!y}"
    } else result = "\\text{Invalid Page}"
    return "\\begin{array}{c}" + result + "\\end{array}"
}
var getTertiaryEquation = () => {
    let result
    if (page == 1) {
        result = `${getTextResource(TextResource.TickRate)}:\\quad ${dt.toString(5)}\\\\c_1^{B(c_2)${unlock.level >= 2 ? "x_1" : ""}}=${tertiary_display[0].toString(3)},\\quad\\sqrt{\\log_{e20}{(1+\\rho)}}=${tertiary_display[1].toString(3)}`
    } else result = ""
    return result
}
var getQuaternaryEntries = () => {
    const result = []
    result.push(formatQuaternaryEntry(
        "\\dot\\rho",
        drho.toString(5)
    ))
    if (page == 1) {
        result.push(formatQuaternaryEntry(
            "t",
            time.toString(2)
        ))
    }
    if (page == 1 && publication.level >= 1) {
        result.push(formatQuaternaryEntry(
            "m",
            BigNumber.from(theory.publicationMultiplier).toString(5)
        ))
    }
    result.push(formatQuaternaryEntry(
        "E",
        unlock.level >= 1 ? getInverseEDisplay(E) : null
    ))
    if (page == 2) {
        result.push(formatQuaternaryEntry(
            "e_1",
            unlock.level >= 1 ? getInverseEDisplay(EDisplay[0]) : null
        ))
        result.push(formatQuaternaryEntry(
            "e_2",
            unlockE.level >= 2 ? getInverseEDisplay(EDisplay[1]) : null
        ))
        result.push(formatQuaternaryEntry(
            "e_3",
            unlockE.level >= 3 ? getInverseEDisplay(EDisplay[2]) : null
        ))
        result.push(formatQuaternaryEntry(
            "e_4",
            unlockE.level >= 4 ? getInverseEDisplay(EDisplay[3]) : null
        ))
    }
    return result
}

var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE), currency.symbol]
var getPublicationMultiplier = tau => 100 * tau.pow(0.115) / (10 + tau).log10()
var getPublicationMultiplierFormula = symbol => `\\frac{100{${symbol}}^{0.115}}{\\log_{10}(10+${symbol})}`
var getTau = () => currency.value
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber()

var getK = level => BigNumber.ZERO + Utils.getStepwisePowerSum(level, 2, 5, 0)
var getC1 = level => BigNumber.ONE + 0.5 * level
var getC2Balance = c2 => {
    const e20 = BigNumber.TEN.pow(20)
    tertiary_display[1] = log(e20, 1 + currency.value).sqrt()
    return c2 / BigNumber.from(log(e20, currency.value.max(e20))).sqrt()
}
var getC2 = level => BigNumber.ONE + 0.25 * Math.min(level, 30) + (level > 30 ? (0.25 * (1 - 0.99 ** (level - 30)) / (1 - 0.99)) : 0)
var getN = level => BigNumber.ONE + Utils.getStepwisePowerSum(level, 2, 10, 0)
var getInverseA = level => BigNumber.E.pow(0.05 * level)
var getA = level => getInverseA(level).pow(-1)
var getB = level => BigNumber.ONE + Utils.getStepwisePowerSum(level, 2, 10, 0)
var getX = level => BigNumber.ONE + Utils.getStepwisePowerSum(level, 2, 10, 0)
var getY = level => BigNumber.ONE + harmonic(level)
var getX1 = level => BigNumber.ONE + 0.01 * level
var getX2Exponent = level => BigNumber.ONE + 0.1 * level
var getX2 = level => BigNumber.E.pow(getX2Exponent(level))
var getDT = level => BigNumber.ONE / 10 * level

var getTickRate = level => BigNumber.from(1.2).pow(level)

var getE1 = n => {
    if (n <= 100) return 1 / (BigNumber.E - (BigNumber.ONE + 1 / n).pow(n))
    // Laurent Series
    return 2 * n / BigNumber.E + 11 * n / (6 * BigNumber.E) - 5 / (72 * BigNumber.E * n) + 17 / (540 * BigNumber.E * BigNumber.from(n).pow(2))
}
var getE2 = (a, b) => getE1(b / a)
var getE3 = x => {
    if (x <= 100) return (x / (x + 1)).pow(-x)
    // Laurent series
    return 2 * x / BigNumber.E + 11 * n / (6 * BigNumber.E) - 5 / (72 * BigNumber.E * x) + 17 / (540 * BigNumber.E * x.pow(2)) - 913 / (51840 * BigNumber.E * x.pow(3))
}
var getE4 = y => {
    y = BigNumber.from(y)
    if (y < 10) return (BigNumber.E - factorial(y) / derangement(y)).pow(-1).abs()
    return ((
        y.pow(y) * (
            (2 * BigNumber.PI * y).sqrt()
            +
            1 / 6 * (BigNumber.PI / 2 / y).sqrt()
            +
            1 / 144 * (BigNumber.PI / 2 / y.pow(3)).sqrt()
            -
            139 * (BigNumber.PI / 2 / y.pow(5)).sqrt() / 25920
            -
            571 * (BigNumber.PI / 2 / y.pow(7)).sqrt() / 1244160
            +
            163879 * (BigNumber.PI / 2 / y.pow(9)).sqrt() / 104509440
            +
            5246819 * (BigNumber.PI / 2 / y.pow(11)).sqrt() / 37623398400
        ) + (-BigNumber.E).pow(y + 1) * (
            - 1 / y
            + 2 / y.pow(2)
            - 5 / y.pow(3)
            + 15 / y.pow(4)
            - 52 / y.pow(5)
            + 203 / y.pow(6)
        )
    ) / (
        BigNumber.E * (-BigNumber.E).pow(y + 1) * (
            - 1 / y
            + 2 / y.pow(2)
            - 5 / y.pow(3)
            + 15 / y.pow(4)
            - 52 / y.pow(5)
            + 203 / y.pow(6)
        )
    )).abs()
}

var factorial = number => {
    if (number <= 5) {
        let result = 1;
        for (let i = 1; i <= number; i++) result *= i
        return result
    }
    return (2 * number * BigNumber.PI).sqrt() * (number / BigNumber.E).pow(number)
}
var derangement = number => {
    let sum = 0
    for (let i = 0; i <= number; i++) sum += (-BigNumber.ONE).pow(i) / factorial(i)
    return factorial(number) * sum
}
var harmonic = number => {
    number = BigNumber.from(number)
    if (number <= 10) {
        let sum = 0;
        for (let i = 1; i <= number; i++) sum += 1 / i
        return sum
    }
    return number.log() + 0.5772156649015328606065120900824024310421 + 1 / (2 * number) - 1 / (12 * number.pow(2)) + 1 / (120 * number.pow(4))
}

var getEDisplay = E => {
    const exponent = E.log10().floor()
    const base = BigNumber.from(E / BigNumber.TEN.pow(exponent))
    return `${base.toString(3)}e${exponent.toString(0)}`
}
var getInverseEDisplay = E => {
    const exponent = E.log10().floor()
    const base = BigNumber.from(E / BigNumber.TEN.pow(exponent))
    return `${(10 / base).toString(3)}e${(-(exponent + 1)).toString(0)}`
}

var getEquationOverlay = _ => {
    const grid = ui.createGrid({
        inputTransparent: true,
        cascadeInputTransparent: false,
        children: [
            ui.createLatexLabel({
                text: version,
                fontSize: 10, 
                margin: new Thickness(4, 4),
                textColor: Color.TEXT_MEDIUM
            }),
            ui.createLatexLabel({
                text: () => {
                    const tph_display = `\\log\\rho/\\text{${getTextResource(TextResource.Hour)}}=${tph.toString(5)}`
                    return Utils.getMath(tph_display)
                },
                fontSize: 10,
                margin: new Thickness(4, 4),
                textColor: Color.TEXT_MEDIUM,
                horizontalOptions: LayoutOptions.END
            })
        ]
    })
    return grid
}

var canGoToPreviousStage = () => page == 2
var goToPreviousStage = () => page = 1
var canGoToNextStage = () => page == 1 && unlock.level >= 1
var goToNextStage = () => page = 2

init()